// data.js — loads japan_trip_data.json and exposes it as window.TripData

window.TripData = null;

window.loadTripData = function() {
  return fetch('japan_trip_data.json')
    .then(r => r.json())
    .then(data => {
      window.TripData = data;
      return data;
    });
};
