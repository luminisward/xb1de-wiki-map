import $ from 'jquery'
import hasOwnProperty from 'has'

function setContainerHeight (element) {
  $(element).height($(element).width() * 0.618)
  $(window).resize(() => {
    $(element).height($(element).width() * 0.618)
  })
}

const onMapSpace = (gmkPoints, map) =>
  gmkPoints.filter(point => {
    const areas = point.printouts ? point.printouts.Areas : point.areas
    return areas
      .map(area => area.toLowerCase())
      .includes(map.mapinfo.Name)
  })

const appendLevel = (point, levels) => {
  for (const level of levels) {
    if (point.posY < level.height) {
      point.level = level
      return point
    }
  }
}

const pointsFilterByLevel = (points, levels, currentLevel) => {
  if (!points[0].level) {
    points = points.map(point => appendLevel(point, levels))
  }
  return points.filter(point => point.level === currentLevel)
}

// ajax

const apiUrl = '/api.php'

const askCache = {}
async function ask (query) {
  if (askCache[query]) return askCache[query]
  const { query: { results } } = await $.ajax({
    url: apiUrl,
    data: {
      action: 'ask',
      query,
      format: 'json'
    }
  })
  askCache[query] = results
  return results
}

function dataApi (options) {
  return $.post('/bdat', {
    ...{
      game: 'xb1',
      language: 'cn'
    },
    ...options
  })
}

export { setContainerHeight, onMapSpace, ask, appendLevel, pointsFilterByLevel, dataApi }
