/*eslint-disable*/
export const displayMap = (locations) => {
  mapboxgl.accessToken =
    "pk.eyJ1IjoiYXJqdW5tdXJhbGkiLCJhIjoiY2t4emlxZjZ3MzBvbjJ1bXZzaGticXJ2cyJ9.Z2jXIfgs8Nqd4PyaxPyOGw";
  var map = new mapboxgl.Map({
    container: "map", // put an element with id map
    style: "mapbox://styles/arjunmurali/ckxyq6z1r3cav14l561sya04g",
    scrollZoom: false,
    //   center: [-118.11,34.11],
    //   zoom: 4,
  });

  //very important try to understand
  const bounds = new mapboxgl.LngLatBounds();
  locations.forEach((loc) => {
    //create marker
    const el = document.createElement("div");
    el.className = "marker";

    //Add marker
    new mapboxgl.Marker({
      element: el,
      anchor: "bottom",
    })
      .setLngLat(loc.coordinates)
      .addTo(map);
    //Extend map bounds to include the current location

    //add popup
    new mapboxgl.Popup({
      offset: 30,
    })
      .setLngLat(loc.coordinates)
      .setHTML(`<p>Day ${loc.day}: ${loc.description}</p>`)
      .addTo(map);
    bounds.extend(loc.coordinates);
  });

  map.fitBounds(bounds, {
    padding: {
      top: 200,
      bottom: 200,
      left: 100,
      right: 100,
    },
  });
};
