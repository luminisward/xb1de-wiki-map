import L from 'leaflet'

import landmarkIcon from './icons/icon_target_large_0_09.png'

export const collectionIcon = L.divIcon({
  className: 'collection-icon',
  iconSize: [12, 12]
})
export const collectionCurrent = L.divIcon({
  className: 'collection-icon collection-current-icon',
  iconSize: [12, 12]
})
export const enemyIcon = L.divIcon({
  className: 'enemy-icon',
  iconSize: [8, 8]
})
export const location = L.divIcon({
  iconSize: [0, 0]
})
export const landmark = L.icon({
  iconUrl: landmarkIcon,
  iconSize: [40, 40]
})
