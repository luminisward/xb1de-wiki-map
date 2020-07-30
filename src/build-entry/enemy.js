import $ from 'jquery'
import '../main.scss'

import { getxb1mapByName } from '../xb1map'
import { enemy as icon } from '../markerIcon'
import { setContainerHeight, queryJson } from '../utils'

// import gmk from '../data/gmk_enemy'

async function draw (element) {
  const gmk = await queryJson('Gmk/enemy')
  const gmkIds = $(element).data('gmkId').split(' ')
  let mapName = $(element).data('mapName')
  if (!mapName) {
    const point = gmk.filter(point => point.Name === gmkIds[0])[0]
    mapName = point.areas[0]
  }

  const map = await getxb1mapByName(element, mapName)
  // 右下角显示地名
  map.attributionControl.setPrefix('<a href="//xenoblade2.cn">XENOBLADE2.CN</a>')
  map.attributionControl.addAttribution(map.mapinfo.mapName + '・' + map.mapinfo.menuGroup)

  const extractBit = (value, field) => {
    return (value >> field) % 2
  }

  gmkIds.forEach(gmkId => {
    const point = gmk.filter(point => point.Name === gmkId)[0]
    if (point && point.areas.includes(map.mapinfo.Name)) {
      let time = ''
      switch (point.POP_TIME) {
        case 1 << 0:
          time = '7:00 ~ 11:59'
          break
        case 1 << 1:
          time = '12:00 ~ 15:59'
          break
        case 1 << 2:
          time = '16:00 ~ 18:59'
          break
        case 1 << 3:
          time = '19:00 ~ 23:59'
          break
        case 1 << 4:
          time = '0:00 ~ 4:59'
          break
        case 1 << 5:
          time = '5:00 ~ 6:59'
          break
        case 1 << 6:
          time = '7:00 ~ 18:59'
          break
        case 1 << 7:
          time = '19:00 ~ 6:59'
          break
        case 1 << 8:
          time = '0:00 ~ 23:59'
          break
        default:
          break
      }

      map.addMarker(point, { icon }, time)
        .on('mouseover', async function () {
          const result = await queryJson('FLD_maplist/' + point.ZoneID)
          const { wa_type: weatherA, wb_type: weatherB, wc_type: weatherC } = result
          const weather = [ // weather d 都是阴天，pop rate都是0，忽略
            { name: '晴', pop: extractBit(point.popWeather, 4) },
            { name: weatherC, pop: extractBit(point.popWeather, 2) },
            { name: weatherB, pop: extractBit(point.popWeather, 1) },
            { name: weatherA, pop: extractBit(point.popWeather, 0) }
          ].filter(weather => weather.name)
          const weatherContent = '<table class="pop-weather">' +
            `<tr>${weather.map(row => `<td>${row.name}</td>`).join('')}</tr>` +
            `<tr>${weather.map(row => `<td>${row.pop ? '✔' : ''}</td>`).join('')}</tr>` +
            '</table>'

          const getScenarioFlagText = async flag => {
            if (flag < 10039) {
              const ScenarioFlag = await queryJson('ScenarioFlag')
              if (ScenarioFlag[flag] !== undefined) {
                return ScenarioFlag[flag]
              } else {
                return flag
              }
            } else {
              return ''
            }
          }
          let ScenarioMin = await getScenarioFlagText(point.ScenarioMin)
          let ScenarioMax = await getScenarioFlagText(point.ScenarioMax)
          if (ScenarioMin === ScenarioMax) {
            ScenarioMin = ''
            ScenarioMax = ''
          }
          const ScenarioContent = ScenarioMin || ScenarioMax ? `<div>${ScenarioMin} ~ ${ScenarioMax}</div>` : ''

          this.setTooltipContent(time + ScenarioContent + weatherContent)
        })
    }
  })
}

async function main () {
  const gmk = await queryJson('Gmk/enemy')

  // multi-map, append div.xb1map
  for (let i = 0; i < $('.multi-xb1map-enemy').length; i++) {
    const element = $('.multi-xb1map-enemy')[i]
    const enemyId = $(element).data('enemyId')

    const EnemyGmkMap = await queryJson('EnemyGmkMap')
    const gmkIds = EnemyGmkMap[enemyId] || []

    const areas = gmkIds.map(gmkId => {
      const point = gmk.filter(point => point.Name === gmkId)[0]

      let mapName
      try {
        mapName = point.areas[0]
      } catch (error) {
        console.log('不存在 ' + gmkId + ' 的坐标数据，忽略')
        mapName = undefined
      }
      return mapName
    }).filter(mapName => mapName)

    const mapSet = new Set(areas)

    mapSet.forEach(mapName => {
      const mapElement = $('<div>')
        .addClass('xb1map-enemy')
        .data('mapName', mapName)
        .data('gmkId', gmkIds.join(' '))
      $(element).append(mapElement)
    })
  }

  // load xb1map
  for (let i = 0; i < $('.xb1map-enemy').length; i++) {
    const element = $('.xb1map-enemy')[i]
    setContainerHeight(element)
    await draw(element)
  }
}
main()
