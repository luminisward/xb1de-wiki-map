import L from 'leaflet'
import './main.scss'
import { pointsFilterByLevel, dataApi } from './utils'
import { location as locationIcon, landmark as landmarkIcon } from './markerIcon'

class Xb1map extends L.Map {
  constructor (element, option, data) {
    const { mapinfo, levels, locations } = data

    const imageBounds = [
      [mapinfo.minimap_lt_x, mapinfo.minimap_lt_z],
      [mapinfo.minimap_rb_x, mapinfo.minimap_rb_z]
    ]
    const imageBoundsRotate180 = [
      [-imageBounds[1][0], -imageBounds[1][1]],
      [-imageBounds[0][0], -imageBounds[0][1]]
    ]

    const files = getFiles(mapinfo.id_name)

    const imageDict = {}
    for (const file of files) {
      const floorId = getFloorId(file)
      if (imageDict[floorId]) {
        if (imageDict[floorId].length < file.length) {
          imageDict[floorId] = file
        } else if (imageDict[floorId].length === file.length && imageDict[floorId] < file) {
          imageDict[floorId] = file
        }
      } else {
        imageDict[floorId] = file
      }
    }

    const baseLayerData = Object.entries(imageDict).map(([floorId, file]) => {
      const imageUrl = require('./map-images/' + file).default
      const level = levels.filter(level => level.file === floorId)
      return {
        floorId,
        floorName: level && level[0].floorname,
        currentLevel: level && level[0],
        file,
        imageOverlay: L.imageOverlay(imageUrl, xyBounds(imageBoundsRotate180))
      }
    })

    option = Object.assign(
      {
        zoomSnap: 0.25,
        minZoom: -3,
        maxZoom: 2,
        crs: L.CRS.Simple,
        // attributionControl: false,
        doubleClickZoom: false,
        layers: [
          baseLayerData[0].imageOverlay
        ]
      },
      option
    )

    super(element, option)

    // 设置右下角显示地名
    this.attributionControl.setPrefix('<a href="//xenoblade.cn">XENOBLADE.CN</a>')
    this.attributionControl.addAttribution(mapinfo.name)

    this.mapinfo = mapinfo
    this.bounds = imageBoundsRotate180
    this.XOffest = imageBounds[0][0] + imageBounds[1][0]
    this.levels = levels

    // landmark
    const landmarksLayer = L.layerGroup().addTo(this)
    this.on('baselayerchange', (data) => {
      const { name } = data

      const layerData = baseLayerData.filter(layerdata => layerdata.floorName === name)[0]
      const landmarks = pointsFilterByLevel(locations, levels, layerData.currentLevel)
      this.currentLevel = layerData.currentLevel

      landmarksLayer.clearLayers()

      landmarks.forEach(point => {
        if (point.category < 2) {
          const tooltip = L.tooltip({
            direction: 'top',
            offset: L.point(0, -18),
            className: 'landmark'
          }).setContent(point.name)
          landmarksLayer.addLayer(this.marker(point, { icon: landmarkIcon }, tooltip))
        } else {
          landmarksLayer.addLayer(this.label(point, { icon: locationIcon }, point.name))
        }
      })
    })

    const baseMaps = {}
    for (const item of baseLayerData) {
      baseMaps[item.floorName] = item.imageOverlay
    }
    L.control.layers(baseMaps, { 地标: landmarksLayer }).addTo(this)
    this.baseMaps = baseMaps

    this.fitBounds(xyBounds(this.bounds))
  }

  marker (point, options, tooltip) {
    const coordinate = xy([point.posX - this.XOffest, -point.posZ])

    const marker = L.marker(coordinate, {
      riseOnHover: true,
      ...options
    })

    // 悬停文本
    if (typeof tooltip === 'string') {
      tooltip = L.tooltip({
        direction: 'bottom',
        offset: L.point(0, 14)
      }).setContent(tooltip)
    }
    if (tooltip) {
      marker.bindTooltip(tooltip)
    }

    return marker
  }

  addMarker (point, options, tooltip) {
    const marker = this.marker(point, options, tooltip)
    this.addLayer(marker)
    return marker
  }

  label (point, options, content = '') {
    let coordinate
    if (typeof point.posX === 'number' && typeof point.posZ === 'number') {
      coordinate = xy([point.posX - this.XOffest, -point.posZ])
    } else {
      coordinate = point
    }

    const label = L.marker(coordinate, {
      ...options
    }).bindTooltip(content, {
      permanent: true,
      className: 'label',
      direction: 'center',
      interactive: true
    })

    return label
  }

  addLabel (point, options, content = '') {
    const label = this.label(point, options, content)
    this.addLayer(label)
    return label
  }

  changeBaseMapTo (floorname) {
    this.removeLayer(this.baseMaps[this.currentLevel.floorname])
    this.addLayer(this.baseMaps[floorname])
  }

  closeAllTooltip () {
    this.eachLayer(layer => layer.closeTooltip())
  }
}

function xy ([x, y]) {
  if (L.Util.isArray(x)) { // When doing xy([x, y]);
    return L.latLng(x[1], x[0])
  }
  return L.latLng(y, x) // When doing xy(x, y);
}

function xyBounds (bounds) {
  return [
    [bounds[0][1], bounds[0][0]],
    [bounds[1][1], bounds[1][0]]
  ]
}

function getFloorId (name) {
  const result = /ma\d{4}_f\d{2}/.exec(name)
  return result && result[0]
}

function getMapId (name) {
  const result = /ma\d{4}/.exec(name)
  return result && result[0]
}

function getFiles (mapid) {
  /* global MAPFILES */
  return MAPFILES.filter(filename => filename.includes(mapid))
}

async function xb1map (element, mapid) {
  const [mapinfo] = await dataApi({
    table: 'bdat_common.FLD_maplist',
    field: 'id_name',
    value: getMapId(mapid)
  })

  const levels = await dataApi({
    table: `bdat_common.minimaplist${mapinfo.id_name.slice('2')}`
  })

  const locations = await dataApi({
    table: 'bdat_common.landmarklist',
    field: 'mapID',
    value: mapinfo.row_id
  })

  return new Xb1map(element, {}, { mapinfo, levels, locations })
}

export { xb1map }
