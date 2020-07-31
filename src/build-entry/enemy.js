import $ from 'jquery'
import L from 'leaflet'

import { xb1map } from '../xb1map'
import { enemyIcon } from '../markerIcon'
import { setContainerHeight, pointsFilterByLevel, dataApi, appendLevel } from '../utils'

async function draw (element) {
  let mapName = $(element).data('mapName')
  const enemyId = $(element).data('enemyId')

  if (!mapName) {
    const enemyData = await dataApi({
      table: 'bdat_common.BTL_enelist',
      row_id: enemyId
    })
    mapName = enemyData.mapID.id_name
  }

  // 创建L地图对象
  const map = await xb1map(element, mapName)

  const responseData = await Promise.all(
    ['ene1ID', 'ene2ID', 'ene3ID', 'ene4ID', 'ene5ID'].map(async field => {
      const points = await dataApi({
        table: `bdat_${map.mapinfo.id_name}.poplist${map.mapinfo.id_name.slice('2')}`,
        field,
        value: enemyId
      })
      return points
    })
  )

  const points = []
  {
    const uniq = new Set()
    for (const point of responseData.flat()) {
      if (!uniq.has(point.row_id)) {
        uniq.add(point.row_id)
        points.push(point)
      }
    }
  }
  const pointsWithLevel = points.map(point => appendLevel(point, map.levels))
  const popLevel = new Set(pointsWithLevel.map(point => point.level))
  const popFloorname = Array.from(popLevel).map(level => level.floorname)
  map.attributionControl.addAttribution('出现楼层: ' + popFloorname.join('、'))

  const enemys = L.layerGroup().addTo(map)
  const reloadCollectionMarker = () => {
    const pointsOnLevel = pointsFilterByLevel(pointsWithLevel, map.levels, map.currentLevel)
    enemys.clearLayers()

    pointsOnLevel.forEach(point => {
      const zIndexOffset = 0
      const icon = enemyIcon

      const marker = map.marker(point, { icon, zIndexOffset, interactive: false })
      point.marker = marker
      enemys.addLayer(marker)
    })
  }
  map.on('baselayerchange', reloadCollectionMarker)
  reloadCollectionMarker()

  // 自动切换到出现的楼层
  if (!popLevel.has(map.currentLevel)) {
    const defaultLevel = popLevel.values().next().value
    map.changeBaseMapTo(defaultLevel.floorname)
  }
}

async function main () {
  // load xb1map
  for (let i = 0; i < $('.xb1map-enemy').length; i++) {
    const element = $('.xb1map-enemy')[i]
    setContainerHeight(element)
    await draw(element)
  }
}
main()
