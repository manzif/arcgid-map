require([
  "esri/config",
  "esri/Map",
  "esri/views/MapView",
  "esri/layers/FeatureLayer",
  "esri/widgets/Legend",
  "esri/widgets/Expand",
  "esri/widgets/FeatureTable",
], function (
  esriConfig,
  Map,
  MapView,
  FeatureLayer,
  Legend,
  Expand,
  FeatureTable
) {
  esriConfig.apiKey =
    "AAPKdffbf02102ea44069ba2aed34b55b1a6WYgH4tH56vPaJg4I9kXv_eU8gHuFALJlBepwvrMLxDSxRCqWJePy2DPMl1Dm5zzq";

  const url =
    "https://services1.arcgis.com/0MSEUqKaxRlEPj5g/ArcGIS/rest/services/ncov_cases2_v1/FeatureServer/1";

  const template = {
    title: "{Country_Region}",
    lastEditInfoEnabled: false,
    content: [
      {
        type: "fields",
        fieldInfos: [
          {
            fieldName: "Confirmed",
            label: "Confirmed",
          },
          {
            fieldName: "Recovered",
            label: "Recovered",
          },
          {
            fieldName: "Deaths",
            label: "Deaths",
          },
          {
            fieldName: "Active",
            label: "Active cases",
          },
        ],
      },
      {
        type: "text",
        text: "Manzi Fabrice",
      },
    ],
  };

  // Creating a unique value Renderer to apply to a FeatureLayer
  const uvrRenderer = {
    type: "unique-value", //autocasts as new UniqueValueRenderer ()
    field: "Confirmed",
    defaultSymbol: {
      type: "simple-marker",
      color: "indigo",
      size: "10px",
    },
    uniqueValueInfos: [
      {
        value: "57126",
        label: "57126",
        symbol: {
          type: "simple-marker",
          color: "green",
          size: "30px",
        },
      },
      {
        value: "> 25,000 - 100,000",
        label: "25,000 - 100,000",
        symbol: {
          type: "simple-marker",
          color: "orange",
          size: "20px",
        },
      },
      {
        value: "> 16,000 - 25,000",
        label: "16,000 - 25,000",
        symbol: {
          type: "simple-marker",
          color: "blue",
          size: "20px",
        },
      },
    ],
  };
  //Initializing the FeatureLayer
  const featureLayer = new FeatureLayer({
    title: "Covid-19",
    url: url,
    popupTemplate: template,
    renderer: uvrRenderer,
    // copyright: "BGMAPP",
  });
  const map = new Map({
    basemap: "arcgis-topographic", // Basemap layer
    // layer: [featureLayer], // add future layer to the map
  });

  const view = new MapView({
    container: "viewDiv",
    map: map,
    // center: [-1.94, 29.87],
    // extent: {
    //   xmin: 3120710.0054239524,
    //   ymin: -333510.2433567528,
    //   xmax: -112760.10566927026,
    //   ymax: -112760.10566927026,
    //   spatialReference: 102100,
    // },
    // center: [-118.805, 34.027],
    zoom: 4, // scale: 72223.819286
    // container: "viewDiv",
    // constraints: {
    //   snapToZoom: false,
    // },
  });

  // add the feature layer to the map
  map.add(featureLayer);


  //check the mapView extent and spatial reference

  // view.on("click", function () {
  //   console.log("\n\n\n hano");
  //   console.log(
  //     "The current mapview are xmax: " + view.extent.ymax,
  //     "ymax: " + view.extent.ymax,
  //     "xmin: " + view.extent.xmin,
  //     "ymin: " + view.extent.ymin
  //   );
  //   console.log("\n", "the view scale: " + view.scale)
  //   console.log("\n", "the view spatial Reference: " + view.spatialReference.wkid);
  //   alert("The current mapview are xmax: " + view.extent.ymax);
  // });
  // Adding a legend and expand widget
  const legend = new Legend({
    view: view,
    container: "legendDiv",
  });

  const expand = new Expand({
    view: view,
    content: document.getElementById("infoDiv"),
    expanded: true,
  });

  view.ui.add(expand, "top-right");

  //setting up client side filtering
  view.whenLayerView(featureLayer).then((layerView) => {
    const field = "Confirmed";

    const filterSelect = document.getElementById("filter");
    // event fires every time there is a change in the select menu
    filterSelect.addEventListener("input", (event) => {
      let filterExpression;
      if (event.target.value === "1=1") {
        console.log("\n\n", "My darling");
        //show all the features
        filterExpression = event.target.value;
      } else if (event.target.value === "other") {
        // show other features not included in the unique renderer
        filterExpression = generateOtherSQLString(field);
      } else {
        console.log("\n\n\n byabaye");
        filterExpression = `${field}='${event.target.value}'`;
      }
      // Apply filter on the client side layerView
      layerView.filter = {
        where: filterExpression,
      };
    });
  });

  // A function which generates a SQL string  for all other filtered values and not included in uniqueValue Rendered

  function generateOtherSQLString(field) {
    //Loop through each uniqueValuesInfos object and create a sql string to
    // exclude all of the info
    let sqlString = "";
    uvrRenderer.uniqueValueInfos.forEach((valueInfo) => {
      sqlString += `${field} <> '${valueInfo.value}' AND `;
    });

    //cut out the last AND string from the final sql string
    //as the loop above adds one at the end
    let lastStrIndex = sqlString.lastIndexOf(`AND`);
    sqlString = sqlString.substr(0, lastStrIndex);
    return sqlString;
  }

  // Adding feature table widget
  view.when(() => {
    // create the feature table
    const featureTable = new FeatureTable({
      view: view,
      layer: featureLayer,
      // fields that will be displayed as columns in the FeatureTable
      fieldConfigs: [
        {
          name: "Country_Region",
          label: "Country_Region",
          direction: "asc",
        },
        {
          name: "Confirmed",
          label: "Confirmed",
        },
        {
          name: "Deaths",
          label: "Deaths",
        },
        {
          name: "Recovered",
          label: "Recovered",
        },
        {
          name: "Active",
          label: "Active",
        },
      ],
      container: document.getElementById("tableDiv")
    });
    //Query for the selected features and zoom to them automatically
    featureTable.on("selection-change", zoomToSelectedFeatures);
  })

  // A function that zooms into the selected features based off the records selected or deselected
  // from the featureTable

  function zoomToSelectedFeatures (event) {
    // check if a row is selected or deselected
    if (event.added.length > 0) {
      // row was seelected 
      currentSelectedOIDs.push()
    }
  }
});
