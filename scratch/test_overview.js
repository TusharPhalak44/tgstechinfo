const path = require('path');
const analyticsController = require(path.join(__dirname, '../backend/src/controllers/analyticsController'));

const req = {
  query: {
    start_date: '2026-08-27',
    end_date: '2026-09-03'
  }
};

const res = {
  json: function(data) {
    console.log('=== OVERVIEW RESPONSE ===');
    console.log(JSON.stringify(data, null, 2));
  },
  status: function(code) {
    console.log('Status code:', code);
    return this;
  }
};

analyticsController.getOverview(req, res);
