'use strict'

module.exports = function () {
  return {
    now: function() {
      return new Date().toISOString().split('T')[0]
    }
  }
}
