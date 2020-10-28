// Load timeseries dataset
var globalLinesTimeseries;
/*
[
    [[0], [1, 2, 3, 4, 5, 6 ...]],
    [[1], [1, 2, 3, 4, 5, 6 ...]],
    [[0], [1, 2, 3, 4, 5, 6 ...]],
    ...
]
*/
var globalLinesShapelet;
var globalShapeletWeight;
var currentLabelLinesTimeseries;
var currentLabelLinesShapelet;
var labelSet;

/*------------*/
var currentLabelSelection;
var currentTimeseriesSelection;
var currentShapeletSelection;

/*------------*/
var distanceAll; // A shapelet to all timeseries with the same label

loadTimeseries();
loadShapelet();
readShapeletWeight();

window.onload = function () {

    getAllDistances();
    var defaultLabelSelection = 0;
    var defaultTimeseriesAndShapeletSelection = 0;
    currentTimeseriesSelection = defaultTimeseriesAndShapeletSelection; // Initialize the currentTimeseriesSelection with defaultTimeseriesAndShapeletSelection 0
    currentShapeletSelection = defaultTimeseriesAndShapeletSelection; // Initialize the currentShapeletSelection with defaultTimeseriesAndShapeletSelection 0
    currentLabelSelection = defaultTimeseriesAndShapeletSelection; // Initialize the currentLabelSelection with defaultTimeseriesAndShapeletSelection 0
    updateTimeseries(defaultLabelSelection); // Initialize the currentLabelLinesTimeseries with defaultLabelSelection 0
    updateShapelet(defaultLabelSelection); // Initialize the currentLabelLinesShapelet with defaultLabelSelection 0
    updateChart(defaultTimeseriesAndShapeletSelection, defaultTimeseriesAndShapeletSelection); // Initialize the chart with the no.0 timeseries and no.0 shapelet
    loadLabelSet();
    loadTimeseriesList();
    loadShapeletList();
    var topK = 5;
    topKCharts(topK);
}

function loadTimeseries() {
    $(document).ready(function () {
        $.ajax({
            type: "GET",
            url: "../datasets/ItalyPowerDemand_dataset/v_1/ItalyPowerDemand/ItalyPowerDemand0/ItalyPowerDemand0_TEST",
            dataType: null,
            success: function (data) { processData(data, "timeseries"); }
        });
    });
}

function loadShapelet() {
    $(document).ready(function () {
        $.ajax({
            type: "GET",
            url: "../datasets/ItalyPowerDemand_dataset/v_1/shapelet/shapelet\&weight/shapelet-original.txt",
            dataType: null,
            success: function (data) { processData(data, "shapelet"); }
        });
    });
}

function readShapeletWeight() {
    $(document).ready(function () {
        $.ajax({
            type: "GET",
            url: "../datasets/ItalyPowerDemand_dataset/v_1/shapelet/shapelet\&weight/shapelet-weight.txt",
            dataType: null,
            success: function (data) { processData(data, "shapeletweight"); }
        });
    });
}

function processData(allText, type) {
    var labelIndex = 0; // The first element of each row is the lable in terms of both timeseries and shapelet
    var allTextLines = allText.split(/\r\n|\n/);
    var lines = [];
    var labelSetTmp = new Set();

    allTextLines.forEach(element => {

        var entries = element.split(',');
        var record_num = entries.length;  // how many elements there are in each row

        // if(type.toLowerCase() == "shapeletweight"){
        //     console.log("record_num: " + record_num);
        //     console.log("entries[0].length: " + entries[0].length);
        // }

        while (entries.length == record_num && entries[0].length > 0) { // Ensure each row is not empty
            var tarr = [];
            var lableArr = [];
            var valueArr = [];

            for (var j = 0; j < record_num; j++) {
                var entry = entries.shift();

                if (entry == null || entry.length == 0) {
                    continue;
                } else if (j == labelIndex) { // Handling the first lable element
                    lableArr.push(entry);
                    labelSetTmp.add(entry);
                } else {
                    valueArr.push(entry);
                }
            }

            tarr.push(lableArr);
            tarr.push(valueArr);
            // Structure of each tarr: [lable, values] (label: [], values: [])
            lines.push(tarr);
        }
    });
    // console.log(lines);

    if (typeof labelSet !== 'undefined' && labelSet.size < labelSetTmp.size) { // If normal, the labelSet.size should always equal to labelSetTmp.size after labelSet initialization
        throw new Error("The label size of timeseries and shapelet are not equal!");
    } else {
        labelSet = labelSetTmp; // For intialization
    }

    if (type.toLowerCase() == "timeseries") {
        var linesTmp = formatTransformForZNormalization(lines); // Choose Z-normalization
        globalLinesTimeseries = linesTmp;
        // globalLinesTimeseries = lines;
    } else if (type.toLowerCase() == "shapelet") {
        var linesTmp = formatTransformForZNormalization(lines); // Choose Z-normalization
        globalLinesShapelet = linesTmp;
        // globalLinesShapelet = lines;
    } else if (type.toLowerCase() == "shapeletweight") {
        // No need to be normalized
        globalShapeletWeight = lines;
    } else {
    }
}

function getShortestDistance(aTimeseries, aShapelet) { /*** Every plot after loading shapelet should calculate the distance between shapelet and TS **/
    var startPosition = 0;
    var distanceBetweenST = 0;
    var distanceMin = Number.POSITIVE_INFINITY;

    for (var i = 0; i < aTimeseries.length - aShapelet.length; i++) { // Discard first label
        // index in indexthis.aVariables.currentShapelet
        distanceBetweenST = 0;
        for (var j = 0; j < aShapelet.length; j++) { // j=1 -> discard first label
            // index in indexthis.aVariables.currentShapelet
            distanceBetweenST += Math.pow(aTimeseries[i + j] - aShapelet[j], 2.0);
        }
        distanceBetweenST = Math.sqrt(distanceBetweenST);

        // console.log("Distance: " + distanceBetweenST);

        //System.out.println("distanceBetweenST "+distanceBetweenST);
        if (distanceBetweenST < distanceMin) {
            distanceMin = distanceBetweenST;
            startPosition = i;
        }
    }
    // System.out.println("From drawShapeletTrace_centerChart() -> startPoint: " + startPosition);
    // this.aVariables.globalStartPosition = startPosition;

    // return distanceMin/((this.aVariables.currentShapelet_.size()-1)*1.0);
    // return distanceMin*1.0;
    // console.log("startPosition: " + startPosition + ", aShapelet.length: " + aShapelet.length);
    // console.log("Distance: " + distanceBetweenST);
    return [distanceMin, startPosition];
}

function updateTimeseries(labelSelection) {
    var labelIndex = 0;
    var valuesArrIndex = 1;
    /*
    [
        [[0], [1, 2, 3, 4, 5, 6 ...]],
        ...
    ]
    */
    // var defaultLabelSelection = 0;

    currentLabelLinesTimeseries = []; //Empty the array

    globalLinesTimeseries.forEach(aTimeseries => {
        if (aTimeseries[labelIndex] == labelSelection) {
            var row = [];
            var arr1 = aTimeseries[labelIndex];
            var arr2 = aTimeseries[valuesArrIndex];
            // console.log("arr1[0]: " + arr1[0]);
            // console.log("arr2[1]: " + arr2[1]);
            row.push(arr1);
            row.push(arr2);
            currentLabelLinesTimeseries.push(row);
        }
    });

    console.log("currentLabelLinesTimeseries.length: " + currentLabelLinesTimeseries.length);
}

function updateShapelet(labelSelection) {
    var labelIndex = 0;
    var valuesArrIndex = 1;
    /*
    [
        [[0], [1, 2, 3, 4, 5, 6 ...]],
        ...
    ]
    */
    // var defaultLabelSelection = 0;

    currentLabelLinesShapelet = []; //Empty the array

    globalLinesShapelet.forEach(aShapelet => {
        if (aShapelet[labelIndex] == labelSelection) {
            var row = [];
            row.push(aShapelet[labelIndex]);
            row.push(aShapelet[valuesArrIndex]);
            currentLabelLinesShapelet.push(row);
        }
    });
}

function getAllDistances() {
    distanceAll = [];
    /*
        [
            [ // one label's distance
                [ // for one shaplet
                    [0], // shapelet no.0
                    [[0, 1.2], [1, 0,97], [2, 3.2], [3, 5.7] ...] // distance from each pari of shapelet and timeseries
                ],
                [ // for another shapelet
                    [1], // shapelet no.1
                    [[0, 0.22], [1, 1,97], [2, 1.51], [3, 3.1] ...] // distance from each pari of shapelet and timeseries
                ]
                ...
            ],
            [ // another label's distance
                
            ]
            ...
        ]
    */

    var labelIndex = 0;
    var valuesIndex = 1;
    var shapeletCount;
    var timeseriesCount;

    labelSet.forEach(label => {
        var shapeletArrSameLabel = [];
        shapeletCount = 0; // For different labels, recount the shapelet no.

        globalLinesShapelet.forEach(shapelet => {
            if (shapelet[labelIndex] == label) {
                var arrForSingleShapelet = [];
                arrForSingleShapelet.push(shapeletCount); // Embed the no. value of this shapelet
                shapeletCount++;
                var distanceArr = []; // Each time for calculate the distances between one shapelet and all timeseries with the same label
                timeseriesCount = 0; // For different shapelet, recount the timeseries no.

                globalLinesTimeseries.forEach(timeseries => {
                    if (timeseries[labelIndex] == label) {
                        var pair = [];
                        pair.push(timeseriesCount); // Embed the timeseries no.
                        timeseriesCount++;

                        var distance = getShortestDistance(timeseries[valuesIndex], shapelet[valuesIndex]);
                        pair.push(distance); // [0, 1.2] ...
                        distanceArr.push(pair); // [[0, 1.2], [1, 0,97], ...]
                    }
                });

                console.log("distanceArr[1][1]: " + distanceArr[1][1]);
                // Before push it into shapeletArrSameLabel, sort distanceArr ascendingly according to distance
                var sorted = distanceArr.sort(function (a, b) {
                    return a[1] - b[1];
                });

                // console.log("sorted[1][0]: " + sorted[1][0]);
                // console.log("&&&&&&--");

                arrForSingleShapelet.push(distanceArr); // Embed the distances array

                shapeletArrSameLabel.push(arrForSingleShapelet); // Embed the distances array

                // console.log("shapeletArrSameLabel.lenth: " + shapeletArrSameLabel.length);
            }
        });

        // console.log("shapeletArrSameLabel.lenth: " + shapeletArrSameLabel.length);
        // console.log("&&&&&&&--");

        distanceAll.push(shapeletArrSameLabel); // Embed the shapeletArrSameLabel for when moving to the next label
    });
}

function topKTimesries() {

}

/*------------------------------------------------------------*/


google.charts.load('current', { 'packages': ['corechart'] });
// google.charts.setOnLoadCallback(drawChart);

function updateChart(noTimeseries, noShapelet) { // updateChart is based on draw chart, and the original drawChart() is deleted
    // console.log("B");
    console.log("currentLabelSelection: " + currentLabelSelection);
    console.log("noTimeseries: " + noTimeseries);
    console.log("noShapelet: " + noShapelet);
    console.log("------------");

    const valueIndex = 1; // The 0 dimension is lable data, the 1 dimension is timeseries data
    var timeseries = currentLabelLinesTimeseries[noTimeseries][valueIndex]; // The timeseries in the list all have the same labels, so that using 'currentLabelLinesTimeseries'
    var shapelet = currentLabelLinesShapelet[noShapelet][valueIndex]; // The shapelets in the list all have the same labels, so that using 'currentLabelLinesShapelet'
    var record_num;  // how many elements there are in each row
    var arr = [];

    // console.log("timeseries: " + timeseries);
    // console.log("shapelet: " + shapelet);
    // console.log("***********");

    if (timeseries.length > shapelet.length) {
        record_num = timeseries.length;
    } else {
        record_num = shapelet.length;
    }

    // console.log("record_num: " + record_num);

    var shapeletStartPosition = getShortestDistance(timeseries, shapelet)[1]; // return [distanceMin, startPosition];

    for (i = 0; i < record_num; i++) {

        if (i == 0) {
            arr.push(['Time Interval', 'Timeseries', 'Shapelets']);
        }

        var localArr = [];
        localArr.push(parseFloat(i));
        localArr.push(parseFloat(timeseries[i]));

        if (i >= shapeletStartPosition && i <= shapeletStartPosition + shapelet.length) {
            localArr.push(parseFloat(shapelet[i - shapeletStartPosition])); // i-shapeletStartPosition: Always keep consisdent with index of timeseries
        } else {
            localArr.push(null);
        }

        arr.push(localArr);

        // text += cars[i] + "<br>";
    }

    var data = google.visualization.arrayToDataTable(
        arr
    );

    //Tabel:
    // [
    //     ['Year', 'Sales', 'Expenses'],
    //     ['2004', 1000, null],
    //     ['2005', 1170, 460],
    //     ['2006', 660, 1120],
    //     ['2007', 1030, 540],
    //     ['2008,', 2010, 760],
    //     ['2009,', 2350, 460],
    // ]

    var options = {
        title: 'Timeseries Analysis',
        curveType: 'function',
        legend: { position: 'bottom' }
    };

    var chart = new google.visualization.LineChart(document.getElementById('curve_chart'));

    chart.draw(data, options);
}

google.charts.load('current', { packages: ['corechart', 'bar'] });
google.charts.setOnLoadCallback(drawRightY);

function drawRightY() {

    var labelIndex = 0;
    var rows = [];

    globalShapeletWeight.forEach(row => {
        var myRow = [];
        var lable = [];
        var weights;
        lable.push(row[labelIndex]);
        weights = row.slice(labelIndex + 1, row.length);
        myRow.push(lable);
        myRow.push(weights[0]);
        rows.push(myRow);
    });

    var arr = [];
    var topK = 10; // default value: top 10
    var record_num = Number.POSITIVE_INFINITY;  // how many elements there are in each row
    rows.forEach(row => {
        if (row[1].length < record_num) {
            record_num = row[1].length;
        }
    });

    if (record_num < topK) {
        topK = record_num;
    }

    for (var i = topK; i > 0; i--) {

        if (i == topK) {
            arr.push(['Weight Ranking', 'Shaplet-Lable-0', 'Shaplet-Lable-1']);
        }

        var localArr = [];
        localArr.push(parseFloat(i));

        rows.forEach(row => {
            if (i > row[1].length) {
                localArr.push(null);
            } else {
                localArr.push(parseFloat(row[1][i]));
            }
        });

        arr.push(localArr);

        // console.log("localArr: " + localArr);

        // text += cars[i] + "<br>";
    }

    var data = google.visualization.arrayToDataTable(
        // [
        // ['City', '2010 Population', '2000 Population'],
        // ['New York City, NY', 8175000, 8008000],
        // ['Los Angeles, CA', 3792000, 3694000],
        // ['Chicago, IL', 2695000, 2896000],
        // ['Houston, TX', 2099000, 1953000],
        // ['Philadelphia, PA', 1526000, 1517000] 
        // ]
        arr
    );

    var materialOptions = {
        chart: {
            title: 'Top-K Maximum Shapelets Ranking',
            subtitle: 'Based on Grace Dataset - 15-points-5-months (Log)'
        },
        hAxis: {
            title: 'Total Population',
            minValue: 0,
        },
        vAxis: {
            title: 'City'
        },
        bars: 'horizontal',
        axes: {
            y: {
                0: { side: 'right' }
            }
        }
    };
    var materialChart = new google.charts.Bar(document.getElementById('chart_div'));
    materialChart.draw(data, materialOptions);
}

function loadLabelSet() {
    // List always contains the timeseries with the same labels, so that using 'currentLabelLinesTimeseries'

    var len = labelSet.size;

    for (var i = 0; i < len; i++) {
        var itemSuper = document.createElement("li");
        var itemSub = document.createElement("a");
        var divider = document.createElement("div");
        itemSub.setAttribute("class", "dropdown-item");
        itemSub.href = "#";
        var node = document.createTextNode("Label-" + String(i)) /*fetching name of the items*/
        divider.setAttribute("class", "dropdown-divider");
        itemSub.appendChild(node);
        itemSuper.appendChild(itemSub);
        document.getElementById('labelList').appendChild(itemSuper);
        if (i != (len - 1)) {
            document.getElementById('labelList').appendChild(divider);
        }
    }

    var elements = document.getElementById('labelList').children;

    Array.from(elements).forEach((element) => {
        element.addEventListener('click', (event) => {
            currentLabelSelection = parseInt(event.target.innerText.replace('Label-', '')); // Update currentLabelSelection with the clicking item and use it in the next line
            updateTimeseries(currentLabelSelection);
            updateShapelet(currentLabelSelection);
        });
    });
}

function loadTimeseriesList() {
    // List always contains the timeseries with the same labels, so that using 'currentLabelLinesTimeseries'

    var len = currentLabelLinesTimeseries.length;

    for (var i = 0; i < len; i++) {
        var item = document.createElement("a");
        item.setAttribute("class", "dropdown-item timeseries-item");
        item.href = "#";
        var node = document.createTextNode(String(i)) /*fetching name of the items*/
        item.appendChild(node);
        document.getElementById('timeseriesList').appendChild(item);
    }

    var elements = document.getElementsByClassName('dropdown-item timeseries-item');

    Array.from(elements).forEach((element) => {
        element.addEventListener('click', (event) => {

            // console.log("ABC---1");
            currentTimeseriesSelection = parseInt(event.target.innerText); // Update currentTimeseriesSelection with the clicking item and use it in the next line
            updateChart(currentTimeseriesSelection, currentShapeletSelection); // Use the currentShapeletSelection with the last shapelet selection
        });
    });
}

function loadShapeletList() {
    // List always contains the timeseries with the same labels, so that using 'currentLabelLinesTimeseries'

    var len = currentLabelLinesShapelet.length;

    for (var i = 0; i < len; i++) {
        var item = document.createElement("a");
        item.setAttribute("class", "dropdown-item shapelet-item");
        item.href = "#";
        var node = document.createTextNode(String(i)) /*fetching name of the items*/
        item.appendChild(node);
        document.getElementById('shapeletList').appendChild(item);
    }

    var elements = document.getElementsByClassName('dropdown-item shapelet-item');

    Array.from(elements).forEach((element) => {
        element.addEventListener('click', (event) => {
            // console.log("ABC---2");
            currentShapeletSelection = parseInt(event.target.innerText); // Update currentTimeseriesSelection with the clicking item and use it in the next line
            updateChart(currentTimeseriesSelection, currentShapeletSelection); // Use the currentTimeseriesSelection with the last timeseries selection
        });
    });
}

function formatTransformForZNormalization(lines) {
    const defaultDataSelection = 0;
    const defaultLabelIndex = 0;
    const defaultValuesIndex = 1;

    var arr = []; // Put all values of each timeseries in an arrs
    lines.forEach(line => {
        var values = line[defaultValuesIndex];
        values.forEach(val => {
            arr.push(val);
        });
    });

    var arrNormalized = zScoreNormalization(arr); // Get z-normalized values

    // Restore all nomarlized values

    var len = lines[0][1].length; // The number of values of the first timeseries(patient) since the length of each timeseries is equal
    var linesTmp = [];
    var count = 0;

    lines.forEach(line => {
        // Only refer to the label of each timeseries
        var lineTmp = [];
        var valuesTmp = [];
        var labelTmp = line[defaultLabelIndex];

        for (var i = count; i < len; i++) { // Each time count 'len' number of values
            var val = arrNormalized[i];
            valuesTmp.push(val);
            arrNormalized.shift();
        }

        // console.log("arrNormalized.length: " + arrNormalized.length);

        lineTmp.push(labelTmp);
        lineTmp.push(valuesTmp);
        linesTmp.push(lineTmp); // Inssert each lineTmp into linesTmp
    });

    return linesTmp;
}

function zScoreNormalization(arr) {

    var total = 0;

    for (var i = 0; i < arr.length; i++) {
        var v = parseFloat(arr[i]);
        total += v;
    }

    var mean = total * 1.0 / arr.length;

    var total1 = 0;

    for (var i = 0; i < arr.length; i++) {
        var v1 = Math.pow(parseFloat(arr[i]) - mean, 2);
        total1 += v1;
    }

    var SD = Math.sqrt(total1 * 1.0 / arr.length);

    var arrTmp = [];
    arr.forEach(val => {
        var result = (val - mean) / SD;
        arrTmp.push(result);
    });

    // console.log(arrTmp);
    return arrTmp;
}

function topKCharts(topK) {
    var start = 0;

    var item1 = document.createElement("ol");
    item1.setAttribute("class", "carousel-indicators");

    var item2 = document.createElement("div");
    item2.setAttribute("class", "carousel-inner");

    var item3a = document.createElement("a");
    item3a.setAttribute("class", "carousel-control-prev");
    item3a.href = "#carouselTopKChartsIndicators";
    item3a.setAttribute("role", "button");
    item3a.setAttribute("data-slide", "prev");
    var subItem3ai = document.createElement("span");
    subItem3ai.setAttribute("class", "carousel-control-prev-icon");
    subItem3ai.setAttribute("aria-hidden", "false");
    var subItem3aii = document.createElement("span");
    subItem3aii.setAttribute("class", "sr-only");
    var textSubItem3aii = document.createTextNode("Previous");
    subItem3aii.appendChild(textSubItem3aii);
    item3a.appendChild(subItem3ai);
    item3a.appendChild(subItem3aii);


    var item3b = document.createElement("a");
    item3b.setAttribute("class", "carousel-control-next");
    item3b.href = "#carouselTopKChartsIndicators";
    item3b.setAttribute("role", "button");
    item3b.setAttribute("data-slide", "next");
    var subItem3bi = document.createElement("span");
    subItem3bi.setAttribute("class", "carousel-control-next-icon");
    subItem3bi.setAttribute("aria-hidden", "false");
    var subItem3bii = document.createElement("span");
    subItem3bii.setAttribute("class", "sr-only");
    var textSubItem3bii = document.createTextNode("Next");
    subItem3bii.appendChild(textSubItem3bii);
    item3b.appendChild(subItem3bi);
    item3b.appendChild(subItem3bii);

    // document.getElementById('carouselTopKChartsIndicators').appendChild(item1); // Since it doesn't work (the active term dosen't change)
    document.getElementById('carouselTopKChartsIndicators').appendChild(item2);
    document.getElementById('carouselTopKChartsIndicators').appendChild(item3a);
    document.getElementById('carouselTopKChartsIndicators').appendChild(item3b);

    for (var i = 0; i < topK; i++) {
        var subItem1 = document.createElement("li");
        subItem1.setAttribute("data-target", "#carouselTopKChartsIndicators");
        subItem1.setAttribute("data-slide-to", i);
        if (i == start) {
            subItem1.setAttribute("class", "active");
        }

        // Parent-Child appending
        item1.appendChild(subItem1);

        var subItem2 = document.createElement("div");
        if (i == start) {
            subItem2.setAttribute("class", "carousel-item active");
        } else {
            subItem2.setAttribute("class", "carousel-item");
        }

        var subSubItem2 = document.createElement("div");
        subSubItem2.setAttribute("class", "container");
        var subSubSubItem2 = document.createElement("div");
        var idName = "topKChart_" + i;
        subSubSubItem2.setAttribute("id", idName);
        subSubSubItem2.setAttribute("class", "lineChart");
        // Parent-Child appending
        subSubItem2.appendChild(subSubSubItem2);
        // var subSubItem2 = document.createElement("img");
        // subSubItem2.setAttribute("src", "./images/b44e708bef1568a61a506283bd57bb10.jpeg");
        // subSubItem2.setAttribute("class", "d-block w-100");
        // subSubItem2.setAttribute("alt", "...");
        subItem2.appendChild(subSubItem2);
        item2.appendChild(subItem2);

        // Find the shapelet first
        // Then find the top5 minimum distances

        // distanceAll's structure
        /*
        [
            [ // one label's distance
                [ // for one shaplet
                    [0], // shapelet no.0
                    [[9, 1.2], [2, 0,97], [7, 3.2], [1, 5.7] ...] // [no. ,distanceValue] distance from each pari of shapelet and timeseries
                ],
                [ // for another shapelet
                    [1], // shapelet no.1
                    [[3, 0.22], [1, 1,97], [5, 1.51], [2, 3.1] ...] // [no. ,distanceValue] distance from each pari of shapelet and timeseries
                ]
                ...
            ],
            [ // another label's distance
                
            ]
            ...
        ]
        */

        var underConditionDistanceArr = distanceAll[currentLabelSelection][currentShapeletSelection];


        // var topKTimeseriesNoArr = [];
        var timeseriesIndex = 1; // According to distanceAll's structure
        var timeseriesNumIndex = 0; // According to distanceAll's structure
        for (var i = 0; i < topK; i++) {
            var numOfTimeseries = underConditionDistanceArr[timeseriesIndex][i][timeseriesNumIndex];
            console.log("numOfTimeseries: " + numOfTimeseries);
            updateTopKCharts(numOfTimeseries, currentShapeletSelection, currentLabelSelection, idName); // Create a chart
        }
    }
}

function updateTopKCharts(noTimeseries, noShapelet, currentlabel, chartId) { // updateChart is based on draw chart, and the original drawChart() is deleted
    // console.log("B");

    const valueIndex = 1; // The 0 dimension is lable data, the 1 dimension is timeseries data
    var timeseries = currentLabelLinesTimeseries[noTimeseries][valueIndex]; // The timeseries in the list all have the same labels, so that using 'currentLabelLinesTimeseries'
    var shapelet = currentLabelLinesShapelet[noShapelet][valueIndex]; // The shapelets in the list all have the same labels, so that using 'currentLabelLinesShapelet'
    var record_num;  // how many elements there are in each row
    var arr = [];

    if (timeseries.length > shapelet.length) {
        record_num = timeseries.length;
    } else {
        record_num = shapelet.length;
    }

    var shapeletStartPosition = getShortestDistance(timeseries, shapelet)[1]; // [distanceMin, startPosition];

    for (i = 0; i < record_num; i++) {

        if (i == 0) {
            arr.push(['Time Interval', 'Timeseries', 'Shapelets']);
        }

        var localArr = [];
        localArr.push(parseFloat(i));
        localArr.push(parseFloat(timeseries[i]));

        if (i >= shapeletStartPosition && i <= shapeletStartPosition + shapelet.length) {
            localArr.push(parseFloat(shapelet[i - shapeletStartPosition])); // i-shapeletStartPosition: Always keep consisdent with index of timeseries
        } else {
            localArr.push(null);
        }

        arr.push(localArr);

        // text += cars[i] + "<br>";
    }

    var data = google.visualization.arrayToDataTable(
        arr
    );

    var options = {
        title: 'Distance between Timeseries no.' + noTimeseries + ' Shapelet no.' + noShapelet + ' Label-' + currentlabel,
        curveType: 'function',
        legend: { position: 'bottom' },
    };

    // console.log("ABC");

    var chart = new google.visualization.LineChart(document.getElementById(chartId));

    chart.draw(data, options);
}