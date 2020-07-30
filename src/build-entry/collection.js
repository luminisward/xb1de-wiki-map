import $ from 'jquery'
import '../main.scss'
import L from 'leaflet'

import { xb1map } from '../xb1map'
import { collectionIcon, collectionCurrent } from '../markerIcon'
import { setContainerHeight, pointsFilterByLevel, dataApi, appendLevel } from '../utils'

async function draw (element) {
  // 高亮道具名
  const highlightCollection = $(element).data('highlightCollection')
  const mapName = $(element).data('mapName').split(',')

  // 创建L地图对象
  const map = await xb1map(element, mapName)

  const points = await dataApi({
    table: `bdat_${map.mapinfo.id_name}.Litemlist${map.mapinfo.id_name.slice('2')}`
  })
  const pointsWithLevel = points.map(point => appendLevel(point, map.levels))

  const collections = L.layerGroup().addTo(map)
  const reloadCollectionMarker = () => {
    const pointsOnLevel = pointsFilterByLevel(pointsWithLevel, map.levels, map.currentLevel)
    collections.clearLayers()

    pointsOnLevel.forEach(point => {
      const pop = [
        [point.itm1ID, point.itm1Per],
        [point.itm2ID, point.itm2Per],
        [point.itm3ID, point.itm3Per],
        [point.itm4ID, point.itm4Per],
        [point.itm5ID, point.itm5Per],
        [point.itm6ID, point.itm6Per],
        [point.itm7ID, point.itm7Per],
        [point.itm8ID, point.itm8Per]
      ].filter(x => x[0] && (x[1] > 0))

      let zIndexOffset = 0
      let icon = collectionIcon
      for (const key in pop) {
        pop[key][1] = `${pop[key][1]}%`
        if (pop[key][0] === highlightCollection) {
          pop[key][0] = red(pop[key][0])
          pop[key][1] = red(pop[key][1])
          icon = collectionCurrent
          zIndexOffset = 1
        }
      }

      const itemPop = '<div class="collection-tooltip"><table>' +
      `<tr><td>ID</td><td>${point.row_id}</td></tr>` +
      `<tr><td>范围</td><td>${point.Radius}</td></tr>` +
      `<tr style='border-bottom:1px solid'><td>数量</td><td>${point.popNum}</td></tr>` +
       pop.map(row => `<tr><td>${row[0]}</td><td>${row[1]}</td></tr>`).join('') +
       '</table></div>'

      const marker = map.marker(point, { icon, zIndexOffset }, itemPop)
      point.marker = marker
      collections.addLayer(marker)
    })
  }
  map.on('baselayerchange', reloadCollectionMarker)
  reloadCollectionMarker()

  const tableData = pointsWithLevel.filter(point => {
    for (let i = 1; i <= 8; i++) {
      if (point[`itm${i}ID`] === highlightCollection) {
        point.highlightPer = point[`itm${i}Per`]
        return true
      }
    }
  })
  if (tableData.length > 0) {
    const table = $('<table></table>').addClass('xbtable')
      .append($('<tr>').append(
        '<th>ID</th>',
        '<th>概率</th>',
        '<th>数量</th>',
        '<th>楼层</th>'
      ))
      .append(tableData.map(point =>
        $('<tr>')
          .append(
            $('<td>').text(point.row_id),
            $('<td>').text(point.highlightPer + '%'),
            $('<td>').text(point.popNum),
            $('<td>').text(point.level.floorname)
          )
          .css('cursor', 'pointer')
          .on('click', () => {
            if (point.level !== map.currentLevel) {
              map.changeBaseMapTo(point.level.floorname)
            }
            if (point.marker.isTooltipOpen() === false) {
              collections.eachLayer(layer => layer.closeTooltip())
            }
            point.marker.toggleTooltip()
          })

      ))
    $(element).after(table)
  }
}

function red (text) { return `<span style="color:red;">${text}</span>` }

async function main () {
  // load xb1map
  for (let i = 0; i < $('.xb1map-collection').length; i++) {
    const element = $('.xb1map-collection')[i]
    setContainerHeight(element)
    await draw(element)
  }
}
main()
