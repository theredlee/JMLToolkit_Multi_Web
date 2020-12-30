// Difference between pageLoad , onload & $(document).ready(): https://stackoverflow.com/questions/7971615/difference-between-pageload-onload-document-ready#:~:text=The%20ready%20event%20occurs%20after,event%20is%20specific%20to%20jQuery.&text=I%20know%20HTML%20document%20load%20means%20all%20page%20element%20load%20complete.
google.charts.load('current', { packages: ['corechart', 'bar'] });
// google.load('visualization', '1.0', { 'packages': ['corechart'], 'callback': drawCharts });

// Load timeseries dataset
var globalLinesTimeseries = [];
/*
[
    [[0], [1, 2, 3, 4, 5, 6 ...]],
    [[1], [1, 2, 3, 4, 5, 6 ...]],
    [[0], [1, 2, 3, 4, 5, 6 ...]],
    ...
]
*/
var globalLinesShapelet = [];
var globalShapeletWeight = [];
var currentLabelLinesTimeseries = [];
var currentLabelLinesShapelet = [];
var labelSet;

/*------------*/
var currentTimeseriesLabelSelection;
var currentShapeletLabelSelection;
var currentTimeseriesSelection;
var currentShapeletSelection;

/*------------*/
var distanceAll; // A shapelet to all timeseries with the same label
const topK = 5; // Initialize the topK = 5

// Asynchronous call before onload

// The ready event occurs after the HTML document has been loaded, =>
$(document).ready(function () {
    // Asynchronous
    readShapeletWeight();
    loadTimeseries();
    loadShapelet();
});

// while the onload event occurs later, when all content (e.g. images) also has been loaded.
window.onload = function () {
    var defaultLabelSelection = 0;
    var defaultTimeseriesAndShapeletSelection = 0;
    currentTimeseriesSelection = defaultTimeseriesAndShapeletSelection; // Initialize the currentTimeseriesSelection with defaultTimeseriesAndShapeletSelection 0
    currentShapeletSelection = defaultTimeseriesAndShapeletSelection; // Initialize the currentShapeletSelection with defaultTimeseriesAndShapeletSelection 0
    currentTimeseriesLabelSelection = defaultTimeseriesAndShapeletSelection;
    currentShapeletLabelSelection = defaultTimeseriesAndShapeletSelection;
    updateTimeseries(defaultLabelSelection); // Initialize the currentLabelLinesTimeseries with defaultLabelSelection 0
    updateShapelet(defaultLabelSelection); // Initialize the currentLabelLinesShapelet with defaultLabelSelection 0
    updateChart(defaultTimeseriesAndShapeletSelection, defaultTimeseriesAndShapeletSelection); // Initialize the chart with the no.0 timeseries and no.0 shapelet
    getAllDistances();
    topKCharts();
    drawOneShapeletAllDistanceHistogram(currentShapeletSelection, currentShapeletLabelSelection);

    var carouseId = "carouselDashboardBarChartIndicators"; // Ensure that you have the same <div id="carouselDashboardBarChartIndicators" ... ></div> in html
    var numberOfChart = 2;
    var chartClassName = "chart--container"; // Class name has to follow the Google Chart Documentation
    var chartIdName = "dashboardBarChart"; // Id name has no limitation (Here i just use the same same as the 'chartClassName')
    carouselDashboardBarChartChart(carouseId, numberOfChart, chartClassName, chartIdName);

    // Add event handlers for label, timeseries, shapelet selections
    addEventHandlers();
}

function addEventHandlers() {
    $('#timeseriesLabelSelectionInput').on("change", function (event) {
        newValue = $(this).find("option:selected").text();
        var label;
        if (newValue == "Timeseries - Class0") {
            label = 0;
        }else{
            label = 1;
        }
        currentTimeseriesLabelSelection = parseInt(parseInt(label));
        updateTimeseries(currentTimeseriesLabelSelection);
        updateChart(currentTimeseriesSelection, currentShapeletSelection); // Use the currentShapeletSelection with the last shapelet selection// updateTopKCharts(currentShapeletSelection, currentShapeletLabelSelection, topK); // TopK is initialized at the variable declaration
    });

    $('#shapeletLabelSelectionInput').on("change", function (event) {
        newValue = $(this).find("option:selected").text();
        var label;
        if (newValue == "Shapelet - Class0") {
            label = 0;
        }else{
            label = 1;
        }
        currentShapeletLabelSelection = parseInt(parseInt(label));
        updateShapelet(currentShapeletLabelSelection);
        updateChart(currentTimeseriesSelection, currentShapeletSelection); // Use the currentShapeletSelection with the last shapelet selection// updateTopKCharts(currentShapeletSelection, currentShapeletLabelSelection, topK); // TopK is initialized at the variable declaration
    });

    $("#timeseriesSelectionInput").on("change", function (event) {
        newValue = $(this).val()
        currentTimeseriesSelection = parseInt(newValue); // Update currentTimeseriesSelection with the clicking item and use it in the next line
        updateChart(currentTimeseriesSelection, currentShapeletSelection); // Use the currentShapeletSelection with the last shapelet selection
    })

    $("#shapeletSelectionInput").on("change", function (event) {
        newValue = $(this).val()
        currentShapeletSelection = parseInt(newValue); // Update currentTimeseriesSelection with the clicking item and use it in the next line
        updateChart(currentTimeseriesSelection, currentShapeletSelection); // Use the currentTimeseriesSelection with the last timeseries selection
        drawOneShapeletAllDistanceHistogram(currentShapeletSelection, currentShapeletLabelSelection);
    })

    var maxLenLabel = labelSet.size - 1;
    var maxLenTimeseries = currentLabelLinesTimeseries.length - 1;
    var maxLenShapelet = currentLabelLinesShapelet.length - 1;
    var minLen = 0

    $("#labelSelectionInput").attr({
        "max": maxLenLabel,        // substitute your own
        "min": minLen          // values (or variables) here
    });

    $("#timeseriesSelectionInput").attr({
        "max": maxLenTimeseries,        // substitute your own
        "min": minLen          // values (or variables) here
    });

    $("#shapeletSelectionInput").attr({
        "max": maxLenShapelet,        // substitute your own
        "min": minLen          // values (or variables) here
    });
}

/*----------------------------------------*/
function loadTimeseries() {
    $(document).ready(function () {
        // Loading test dataset
        $.ajax({
            type: "GET",
            url: "../datasets/ItalyPowerDemand_dataset/v_1/ItalyPowerDemand/ItalyPowerDemand0/ItalyPowerDemand0_TEST",
            dataType: null,
            success: function (data) { processData(data, "timeseries"); }
        });
        // Loading train dataset
        $.ajax({
            type: "GET",
            url: "../datasets/ItalyPowerDemand_dataset/v_1/ItalyPowerDemand/ItalyPowerDemand0/ItalyPowerDemand0_TRAIN",
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
        // Since the timeseries dataset has train and test dataset, therefore this block will be called twice. Thus, the array concat() function is needed.
        console.log("Loading timeseries dataset (this block will be invoked twice).");
        var linesTmp = formatTransformForZNormalization(lines); // Choose Z-normalization
        var tempArr = globalLinesTimeseries;
        globalLinesTimeseries = tempArr.concat(linesTmp);
        console.log("-----------------");
    } else if (type.toLowerCase() == "shapelet") {
        console.log("Loading shapelet dataset.");
        var linesTmp = formatTransformForZNormalization(lines); // Choose Z-normalization
        globalLinesShapelet = linesTmp;
        console.log("-----------------");
        // console.log("globalLinesShapelet:");
        // console.log(globalLinesShapelet);
        // globalLinesShapelet = lines;
    } else if (type.toLowerCase() == "shapeletweight") {
        // Assign a no. column to this dataset

        /*
        globalShapeletWeight:
        [
            [[0], [[shapeletNo, shapeletValue], [shapeletNo, shapeletValue], [shapeletNo, shapeletValue], ...]],
            [[1], [[shapeletNo, shapeletValue], [shapeletNo, shapeletValue], [shapeletNo, shapeletValue], ...]],
        ...
        ]
        */

        var newLines = [];
        lines.forEach(line => {
            var lineCount = 0;
            var labelIndex = 0;
            var valuesIndex = 1;
            var startIndex = 1;
            var label = line[labelIndex];
            var newLine = [];
            var newValues = [];
            var values = line[valuesIndex];
            for (var i = startIndex; i < values.length; i++) {
                var weight = values[i];
                var arr = [lineCount, weight];
                lineCount++;
                newValues.push(arr);
            }
            newValues.sort((a, b) => (parseFloat(a[1]) < parseFloat(b[1])) ? 1 : -1); // Sort the pairs (descending)
            newLine.push([label]);
            newLine.push(newValues);
            newLines.push(newLine);
            // console.log("newLine: " + newLine);
        });

        // No need to be normalized
        globalShapeletWeight = newLines;
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

        // console.log("Distance: " + distanceBetweenST);

        distanceBetweenST = Math.sqrt(distanceBetweenST);
        //System.out.println("distanceBetweenST "+distanceBetweenST);
        if (distanceBetweenST < distanceMin) {
            distanceMin = distanceBetweenST;
            startPosition = i;
        }
    }

    if (distanceMin === Infinity) {
        for (var j = 0; j < aShapelet.length; j++) { // j=1 -> discard first label
            // index in indexthis.aVariables.currentShapelet
            // distanceBetweenST += Math.pow(aTimeseries[i + j] - aShapelet[j], 2.0);
            console.log("-------")
            console.log("aTimeseries[i + j]:")
            console.log(aTimeseries[i + j])
            console.log("aShapelet[j]:")
            console.log(aShapelet[j])
        }

        console.log("aShapelet:")
        console.log(aShapelet)

        throw new Error('Infinity exception message');
    }

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
                    [
                        [label0, [[timeseriesNo., [distance, start position]], [timeseriesNo., [distance, start position]], [timeseriesNo., [distance, start position]]]],
                        [label1, [[timeseriesNo., [distance, start position]], [timeseriesNo., [distance, start position]], [timeseriesNo., [distance, start position]]]]
                    ]
                    // distance from each pari of shapelet and timeseries
                ],
                [ // for another shapelet
                    [1], // shapelet no.1
                    [
                        [label0, [[timeseriesNo., [distance, start position]], [timeseriesNo., [distance, start position]], [timeseriesNo., [distance, start position]], ...]],
                        [label1, [[timeseriesNo., [distance, start position]], [timeseriesNo., [distance, start position]], [timeseriesNo., [distance, start position]], ...]]
                    ]
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

    labelSet.forEach(labelA => {
        var shapeletArrSameLabel = [];
        shapeletCount = 0; // For different labels, recount the shapelet no.

        globalLinesShapelet.forEach(shapelet => {
            if (shapelet[labelIndex] == labelA) {
                var arrForSingleShapelet = [];
                var twoLabelsAllTimeseriesInfoArr = [];
                
                arrForSingleShapelet.push(shapeletCount); // Embed the no. value of this shapelet
                shapeletCount++;

                labelSet.forEach(labelB => {
                    timeseriesCount = 0; // For different shapelet, recount the timeseries no.timeseriesCount = 0; // For different shapelet, recount the timeseries no.
                    var distanceArr = []; // Each time for calculate the distances between one shapelet and all timeseries with the same label
                    // Add related label at first
                    var oneLabelAllTimeseriesArr = [];

                    oneLabelAllTimeseriesArr.push(labelB);

                    globalLinesTimeseries.forEach(timeseries => {
                        var relatedLabel = timeseries[labelIndex];
                        if (relatedLabel == labelB) {
                            var allInfoForOneTimeseriesPair = [];
                            allInfoForOneTimeseriesPair.push(timeseriesCount); // Embed the timeseries no.
                            timeseriesCount++;
                            var distancePair = getShortestDistance(timeseries[valuesIndex], shapelet[valuesIndex]); // [distance, startPosition]
                            allInfoForOneTimeseriesPair.push(distancePair); // [0, [1.2, startPosition]] ...
                            distanceArr.push(allInfoForOneTimeseriesPair); // [[0, [1.2, startPosition]], [1, [0,97, startPosition]], ...]
                        }
                    });
                    // console.log("distanceArr[1][0]: " + distanceArr[1][0]);

                    // Before push it into shapeletArrSameLabel, sort distanceArr ascendingly according to distance
                    distanceArr.sort((a, b) => (parseFloat(a[1][0]) > parseFloat(b[1][0])) ? 1 : -1);

                    // After sorting, insert distanceArr into label differentiated oneLabelAllTimeseriesArr
                    oneLabelAllTimeseriesArr.push(distanceArr);
                    // console.log("distanceArr[1][0]: " + distanceArr[1][0]);
                    // console.log("&&&&&&--");
                    twoLabelsAllTimeseriesInfoArr.push(oneLabelAllTimeseriesArr); // Embed the distances array
                });

                arrForSingleShapelet.push(twoLabelsAllTimeseriesInfoArr);

                shapeletArrSameLabel.push(arrForSingleShapelet); // Embed the distances array

                // console.log("shapeletArrSameLabel.lenth: " + shapeletArrSameLabel.length);
            }
        });

        // console.log("shapeletArrSameLabel.lenth: " + shapeletArrSameLabel.length);
        // console.log("&&&&&&&--");

        distanceAll.push(shapeletArrSameLabel); // Embed the shapeletArrSameLabel for when moving to the next label
    });
}

/*------------------------------------------------------------*/
function updateChart(noTimeseries, noShapelet) { // updateChart is based on draw chart, and the original drawChart() is deleted
    // console.log("B");
    console.log("currentTimeseriesLabelSelection: " + currentTimeseriesLabelSelection);
    console.log("currentShapeletLabelSelection: " + currentShapeletLabelSelection);
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
        titleTextStyle: {
            fontSize: 13 // or the number you want
        },
        curveType: 'function',
        legend: { position: 'bottom', textStyle: {
            textStyle: {
                fontSize: 10 // or the number you want
            }
        }},
        vAxis: {
            ticks: [-5, 0, 5]
        }
    };

    var chart = new google.visualization.LineChart(document.getElementById('curve_chart'));

    chart.draw(data, options);
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

    var valuesIndex = 1;
    var linesTmp = [];

    lines.forEach(line => {
        var len = line[valuesIndex].length; // The number of values of the each shapelet/timeseries(patient) since the length of each timeseries is equal
        // Only refer to the label of each timeseries
        var lineTmp = [];
        var valuesTmp = [];
        var labelTmp = line[defaultLabelIndex];

        for (var i = 0; i < len; i++) { // Each time count 'timeseriesLen' number of values
            var val = arrNormalized[i];
            if (val === undefined) {
                throw new Error('Result Infinity exception message');
            }
            valuesTmp.push(val);
        }

        // we have to shift a shapelet/timeseries length of elements once, instead of one by one. Otherwise, it will cause some mechanical issue
        for (var i = 0; i < len; i++) {
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
        if (result === undefined) {
            console.log("result:");
            console.log(result);
            throw new Error('Result Infinity exception message');
        }
        arrTmp.push(result);
    });

    arrTmp.forEach(val => {
        // console.log("---");
        if (val === undefined || val === Infinity) {
            console.log("val:");
            console.log(val);
        }
    });

    // console.log("arrTmp:");
    // console.log(arrTmp);
    return arrTmp;
}

function topKCharts() {
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
            subItem2.setAttribute("class", "carouselTopKChartsIndicators carousel-item active");
        } else {
            subItem2.setAttribute("class", "carouselTopKChartsIndicators carousel-item");
        }

        var subSubItem3 = document.createElement("div");
        var subSubSubItem3i = document.createElement("h6");
        var subSubSubItem3ii = document.createElement("p");
        subSubItem3.className = "container p-8 my-3 bg-dark text-white";
        // subSubSubItem3i.innerHTML = "The " + distanceDescriptionArr[i] + " shortest distance";
        subSubSubItem3i.innerHTML = "The Shortest Distance Pair: " + (i + 1);
        subSubSubItem3ii.innerHTML = "The smaller the distance between shapelet and timeseries, the higher the similarity between them.";
        subSubItem3.appendChild(subSubSubItem3i);
        subSubItem3.appendChild(subSubSubItem3ii);

        var subSubItem2 = document.createElement("div");
        subSubItem2.setAttribute("class", "container justify-content-center");
        subSubItem2.setAttribute("id", "topKChartContainer_" + i);
        subSubItem2.setAttribute("style", "padding-right: 15%; padding-left: 15%;");
        subItem2.appendChild(subSubItem3);
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
                    [
                        [label0, [[timeseriesNo., [distance, start position]], [timeseriesNo., [distance, start position]], [timeseriesNo., [distance, start position]]]],
                        [label1, [[timeseriesNo., [distance, start position]], [timeseriesNo., [distance, start position]], [timeseriesNo., [distance, start position]]]]
                    ]
                    // distance from each pari of shapelet and timeseries
                ],
                [ // for another shapelet
                    [1], // shapelet no.1
                    [
                        [label0, [[timeseriesNo., [distance, start position]], [timeseriesNo., [distance, start position]], [timeseriesNo., [distance, start position]], ...]],
                        [label1, [[timeseriesNo., [distance, start position]], [timeseriesNo., [distance, start position]], [timeseriesNo., [distance, start position]], ...]]
                    ]
                ]
                ...
            ],
            [ // another label's distance
                
            ]
            ...
        ]
    */
    }

    var initialChartId = 0 // initialID = 0
    var twoLabelsTopKArr = getTopKDistance(currentShapeletSelection, currentShapeletLabelSelection, topK); // return [firstTimeseriesSelection, timeseriesLabel, distance, shapeletStartPosition]s

    var firstMinimunDistanceIndex = 0;
    /*---*/
    var timeseriesNumIndex = 0;
    var timeseriesNumIndex = 0;
    var timeseriesLabelIndex = 1;
    var distanceIndex = 0;
    var shapeletStartPositionIndex = 1;
    var newDistanceAndStartPositionIndex = 2;

    var timeseriesInfoArr = twoLabelsTopKArr[firstMinimunDistanceIndex]; // currentIdIndex select top kth distance
    var timeseriesNumSelection = timeseriesInfoArr[timeseriesNumIndex];
    var timeseriesLabel = timeseriesInfoArr[timeseriesLabelIndex];
    var distance = timeseriesInfoArr[newDistanceAndStartPositionIndex][distanceIndex];
    var shapeletStartPosition = timeseriesInfoArr[newDistanceAndStartPositionIndex][shapeletStartPositionIndex];

    console.log("timeseriesNumSelection: " + timeseriesNumSelection + ", timeseriesLabel: " + timeseriesLabel + "currentTimeseriesLabelSelection: " + currentTimeseriesLabelSelection + ", currentShapeletSelection: " + currentShapeletSelection + "currentShapeletLabelSelection: " + currentShapeletLabelSelection + ", distance: " + distance);

    setATopKCharts(timeseriesNumSelection, currentShapeletSelection, currentShapeletLabelSelection, initialChartId, timeseriesLabel, distance, shapeletStartPosition);
    // Bind the courasel event
    updateTopKCharts();
}

function updateTopKCharts() {

    $('#carouselTopKChartsIndicators').bind('slid.bs.carousel', function () { // slid.bs.carousel: This event is fired when the carousel has completed its slide transition.
        var currentIdIndex = $('div.active.carouselTopKChartsIndicators').index();
        // console.log("currentIdIndexTopK: " + currentIdIndex);
        // -------------------------------------------------------------------------------
        var twoLabelsTopKArr = getTopKDistance(currentShapeletSelection, currentShapeletLabelSelection, topK); // return [firstTimeseriesSelection, timeseriesLabel, distance, shapeletStartPosition]

        /*---*/
        var timeseriesNumIndex = 0;
        var timeseriesLabelIndex = 1;
        var distanceIndex = 0;
        var shapeletStartPositionIndex = 1;
        var newDistanceAndStartPositionIndex = 2;

        var timeseriesInfoArr = twoLabelsTopKArr[currentIdIndex]; // currentIdIndex select top kth distance
        var timeseriesNumSelection = timeseriesInfoArr[timeseriesNumIndex];
        var timeseriesLabel = timeseriesInfoArr[timeseriesLabelIndex];
        var distance = timeseriesInfoArr[newDistanceAndStartPositionIndex][distanceIndex];
        var shapeletStartPosition = timeseriesInfoArr[newDistanceAndStartPositionIndex][shapeletStartPositionIndex];

        console.log("timeseriesNumSelection: " + timeseriesNumSelection + ", timeseriesLabel: " + timeseriesLabel + "currentTimeseriesLabelSelection: " + currentTimeseriesLabelSelection + ", currentShapeletSelection: " + currentShapeletSelection + "currentShapeletLabelSelection: " + currentShapeletLabelSelection + ", distance: " + distance);

        setATopKCharts(timeseriesNumSelection, currentShapeletSelection, currentShapeletLabelSelection, currentIdIndex, timeseriesLabel, distance, shapeletStartPosition); // Create a chart
        // -------------------------------------------------------------------------------
    });
}

function setATopKCharts(noTimeseries, noShapelet, currentlabel, aChartId, aTimeseriesLabel, aDistance, aStartPosition) { // updateChart is based on draw chart, and the original drawChart() is deleted
    // console.log("B");
    // ------------------------------------------
    // Retirve to the DOM structure in function topKCharts()
    var subSubItem2 = document.getElementById('topKChartContainer_' + aChartId);

    // Remove all children charts to avoid duplicated charts
    while (subSubItem2.firstChild) {
        subSubItem2.removeChild(subSubItem2.firstChild);
    }

    var subSubSubItem2 = document.createElement("div");
    var chartId = "topKChart_" + aChartId;
    subSubSubItem2.setAttribute("id", chartId);
    subSubSubItem2.setAttribute("class", "lineChart");
    subSubSubItem2.setAttribute("style", "width: 100%; height: 40%;");
    // Parent-Child appending
    subSubItem2.appendChild(subSubSubItem2);

    // ------------------------------------------

    const valueIndex = 1; // The 0 dimension is lable data, the 1 dimension is timeseries data

    console.log("noTimeseries:");
    console.log(noTimeseries);

    var timeseries = globalLinesTimeseries[noTimeseries][valueIndex]; // Find the specific timeseries from globalLinesTimeseries
   
    var shapelet = currentLabelLinesShapelet[noShapelet][valueIndex]; // The shapelets in the list all have the same labels, so that using 'currentLabelLinesShapelet'
    var record_num;  // how many elements there are in each row
    var arr = [];

    if (timeseries.length > shapelet.length) {
        record_num = timeseries.length;
    } else {
        record_num = shapelet.length;
    }

    var shapeletStartPosition = aStartPosition; // [distanceMin, startPosition];

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
        title: '[Distance]' + '\n shapelet no.:' + noShapelet + ' (label no.' + currentlabel + ')' + '\ntimeseries no.:' + noTimeseries + ' (label no. ' + aTimeseriesLabel + ')' + '\n distance: ' + aDistance.toFixed(2),
        titleTextStyle: {
            fontSize: 8 // or the number you want
        },
        curveType: 'function',
        legend: { position: 'bottom', textStyle: {
                fontSize: 10 // or the number you want
        }},
        
        curveType: 'function',
        vAxis: {
            ticks: [-5, 0, 5]
        }
    };

    // console.log("ABC");

    var chart = new google.visualization.LineChart(document.getElementById(chartId));
    chart.draw(data, options);
}

function getTopKDistance(shapeletSelection, labelSelection, topK) {
    var twoLabelsTimeseriesIndex = 1; // According to distanceAll's structure
    var timeseriesLabelIndex = 0; // According to distanceAll's structure
    var timeseriesValArrIndex = 1; // According to distanceAll's structure
    var timeseriesNumIndex = 0; // According to distanceAll's structure
    var distanceAndStartPositionArrIndex = 1; // According to distanceAll's structure

    var underConditionDistanceArr = distanceAll[labelSelection][shapeletSelection];
    // For each label timeseries array, retrieve topK number of timeserise distance and sort them together
    var twoLabelsTimeseriesSelection = underConditionDistanceArr[twoLabelsTimeseriesIndex];
    var twoLabelsTopKArr = [];
    /*
    [
        [label0, [[timeseriesNo., [distance, start position]], [timeseriesNo., [distance, start position]], [timeseriesNo., [distance, start position]], ...]],
        [label1, [[timeseriesNo., [distance, start position]], [timeseriesNo., [distance, start position]], [timeseriesNo., [distance, start position]], ...]]
    ]
    */
    twoLabelsTimeseriesSelection.forEach(eachLabelAllTimeseriesSelection => {
        /*
        [
            [timeseriesNo., label, [distance, start position]], [timeseriesNo., label, [distance, start position]], [timeseriesNo., label, [distance, start position]], ...
        ]
        If topK = 5, the length of twoLabelsTopKArr will be 10.
        */
        var timeseriesLabel = eachLabelAllTimeseriesSelection[timeseriesLabelIndex];
        // Only select top K minimum timeseries distance from each label    
        for (var i = 0; i < topK; i++) {
            var eachTimeseriesInfoArr = [];
            var aTimeseriesInfoArr = eachLabelAllTimeseriesSelection[twoLabelsTimeseriesIndex][i];
            var timeseriesNum = aTimeseriesInfoArr[timeseriesNumIndex];
            var timeseriesDistanceAndStartPosition = aTimeseriesInfoArr[distanceAndStartPositionArrIndex];
            eachTimeseriesInfoArr.push(timeseriesNum);
            eachTimeseriesInfoArr.push(timeseriesLabel);
            eachTimeseriesInfoArr.push(timeseriesDistanceAndStartPosition);

            twoLabelsTopKArr.push(eachTimeseriesInfoArr);
        }
    });

    // Sort twoLabelsTopKArr
    var newDistanceAndStartPositionIndex = 2;
    var distanceIndex = 0;
    twoLabelsTopKArr.sort((a, b) => (parseFloat(a[newDistanceAndStartPositionIndex][distanceIndex]) > parseFloat(b[newDistanceAndStartPositionIndex][distanceIndex])) ? 1 : -1);

    return twoLabelsTopKArr;
}

/*----------------------*/
// https://jsfiddle.net/canvasjs/fz66o4L0/

function carouselDashboardBarChartChart(carouseId, numberOfChart, chartClassName, chartIdName) {
    var herf = "#" + carouseId;
    // var item1 = document.createElement("ol");
    // item1.setAttribute("class", "carousel-indicators"); // The carousel-indicators created by js doesn't work, so hardcode them in html

    var item2 = document.createElement("div");
    item2.setAttribute("class", "carousel-inner");

    var item3a = document.createElement("a");
    item3a.setAttribute("class", "carousel-control-prev");
    item3a.href = herf;
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
    item3b.href = herf;
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
    document.getElementById(carouseId).appendChild(item2);
    document.getElementById(carouseId).appendChild(item3a);
    document.getElementById(carouseId).appendChild(item3b);
    /*-----------------*/

    var start = 0;
    for (var i = 0; i < numberOfChart; i++) {
        var idName = chartIdName + "_" + i;

        var subItem2 = document.createElement("div");
        if (i == start) {
            subItem2.setAttribute("class", "carouselDashboardBarChartIndicators carousel-item active");
        } else {
            subItem2.setAttribute("class", "carouselDashboardBarChartIndicators carousel-item");
        }

        var subSubItem2 = document.createElement("div");
        var subSubItem3 = document.createElement("div");
        var subSubSubItem3i = document.createElement("h6");
        var subSubSubItem3ii = document.createElement("p");
        subSubItem3.className = "container p-8 my-3 bg-dark text-white";
        subSubSubItem3i.innerHTML = "Shapelet Weight Class: " + i;
        subSubSubItem3ii.innerHTML = "The greater the shapelet weight, the more it timeseries small distance.";
        subSubItem3.appendChild(subSubSubItem3i);
        subSubItem3.appendChild(subSubSubItem3ii);

        subSubItem2.setAttribute("id", idName);
        subSubItem2.setAttribute("class", chartClassName);

        // Remove all children charts to avoid duplicated charts
        while (subItem2.firstChild) {
            subItem2.removeChild(subItem2.firstChild);
        }

        subItem2.appendChild(subSubItem3);
        subItem2.appendChild(subSubItem2);
        item2.appendChild(subItem2);
    }

    // Initialize the first active carousel slide in the first chart
    var initializedIndex = 0;
    // drawHistogram(initializedIndex);
    drawDashboardBarChart(initializedIndex);

    var allRenderedCount = 0; // After all slides rendered, stop update

    // For rendering update
    $('#carouselDashboardBarChartIndicators').bind('slid.bs.carousel', function () { // slid.bs.carousel: This event is fired when the carousel has completed its slide transition.
        if (allRenderedCount < 1) {
            var currentIndex = $('div.active.carouselDashboardBarChartIndicators').index();
            var currentNodeChildren = $('div.active.carouselDashboardBarChartIndicators').children();
            var firstChildId = currentNodeChildren[0].id;
            // console.log(currentIndex + '/2');
            console.log("currentNodeIdHistogram: " + firstChildId);

            // Render the chart when the slide has occured and compeleted rendering
            // drawHistogram(currentIndex);
            drawDashboardBarChart(currentIndex);
            allRenderedCount++;
        }
    });
}

function drawDashboardBarChart(numOfIndex) {

    console.log("numOfIndex:");
    console.log(numOfIndex);

    var carouseId = "carouselDashboardBarChartIndicators"; // Ensure that you have the same <div id="carouselDashboardBarChartIndicators" ... ></div> in html

    /*------------*/
    var secondChildIndex = 1; // The second element is <div class="carousel-inner">...</div>
    var carouselInner = document.getElementById(carouseId).children[secondChildIndex];
    var carouselItem = carouselInner.children[numOfIndex];
    var firstChildIndex = 1;
    var chartDiv = carouselItem.children[firstChildIndex];
    var chartIdName = chartDiv.id;
    // console.log("idName: " + idName);

    // Create a chart
    var labelIndex = 0;
    var valuesIndex = 1;

    var topK = 5; // default value: top 10
    var record_num = Number.POSITIVE_INFINITY;  // how many elements there are in each row

    globalShapeletWeight.forEach(row => {
        if (row[valuesIndex].length < record_num) {
            record_num = row[valuesIndex].length;
        }
    });

    if (record_num < topK) {
        topK = record_num;
    }
    /*------------------*/
    shapeletNoArr = []
    shapeletWeightArr = []
    weightIndex = 1
    shapeletNoIndex = 0
    shapeletWeightIndex = 1

    globalShapeletWeight.forEach(row => {
        currentShapeletNoArr = []
        currentShapeletWeightArr = []
        for (var i = topK - 1; i >= 0; i--) { // Since the index is from 0 -> top K
            // localArr.push(i);
            currentShapeletNoArr.push('Shapelet no. ' + row[weightIndex][i][shapeletNoIndex]);
            // currentShapeletWeightArr.push(row[weightIndex][i][shapeletWeightIndex]);
            currentShapeletWeightArr.push(parseInt(row[weightIndex][i][shapeletWeightIndex]));
        }
        shapeletNoArr.push(currentShapeletNoArr);
        shapeletWeightArr.push(currentShapeletWeightArr);
    });

    // var aMax = Number.NEGATIVE_INFINITY;
    // shapeletWeightArr.forEach(weight => {
    //     if (weight>aMax) {
    //         aMax = weight;
    //     }
    // });

    var maxWeightVal = parseFloat(Math.max.apply(Math, shapeletWeightArr[numOfIndex])) * 1.4; // Set the whole length of a bar is 110% 
    console.log("maxWeightVal:")
    console.log(maxWeightVal)
    shapeletWeightSupplementaryArr = []
    // 0.1 * each element in shapeletWeightArr and store them into shapeletWeightSupplementaryArr for dashboard chart visualization effect
    shapeletWeightArr[numOfIndex].forEach(weight => {
        val = parseInt(maxWeightVal) - weight;
        shapeletWeightSupplementaryArr.push(parseInt(val));
    });

    // console.log('globalShapeletWeight:');
    // console.log(globalShapeletWeight);

    // console.log('shapeletNoArr:');
    // console.log(shapeletNoArr);

    /* --------------------------- */
    /* --------------------------- */

    ZC.LICENSE = ["569d52cefae586f634c54f86dc99e6a9", "b55b025e438fa8a98e32482b5f768ff5"];
    let chartConfig = {
        type: 'hbar',
        backgroundColor: '#2A2B3A',
        plot: {
            title: {
                "text": "Tech Giant Quarterly Revenue",
                "font-color": "#ffffff",
            },
            tooltip: {
                borderRadius: '2px',
                borderWidth: '0px'
            },
            valueBox: {
                text: '%v',
                fontColor: '#2A2B3A',
                fontSize: '10px',
                visible: true
            },
            animation: {
                effect: 'ANIMATION_EXPAND_TOP',
                method: 'ANIMATION_BOUNCE_EASE_OUT',
                sequence: 'ANIMATION_BY_PLOT_AND_NODE',
                delay: 400
            },
            barsSpaceRight: '20px',
            barsSpaceLeft: '20px',
            stacked: true
        },
        plotarea: {
            marginTop: '30px',
            marginBottom: '30px',
            marginLeft: '100px'
        },
        scaleX: {
            item: {
                fontColor: '#e8e8e8',
                fontSize: '10px'
            },
            // labels: ['Dev', 'R&D', 'Testing'],
            labels: shapeletNoArr[numOfIndex],
            lineColor: 'transparent',
            tick: {
                visible: false
            }
        },
        scaleY: {
            guide: {
                visible: false
            },
            lineColor: 'transparent',
            tick: {
                visible: false
            },
            visible: false
        },
        tooltip: {
            visible: false
        },
        series: [{
            //   values: [3, 2, 6],
            values: shapeletWeightArr[numOfIndex],
            backgroundColor: '#E71D36',
            borderRadius: '50px 0px 0px 50px',
            rules: [{
                backgroundColor: '#4287f5',
                rule: '%i === 0'
            },
            {
                backgroundColor: '#bb60f0',
                rule: '%i === 1'
            }, {
                backgroundColor: '#E71D36',
                rule: '%i === 2'
            },
            {
                backgroundColor: '#2EC4B6',
                rule: '%i === 3'
            },
            {
                backgroundColor: '#FF9F1C',
                rule: '%i === 4'
            }
            ]
        },
        {
            //   values: [7, 8, 4],
            values: shapeletWeightSupplementaryArr,
            backgroundColor: '#E71D36',
            borderRadius: '0px 50px 50px 0px',
            rules: [{
                backgroundColor: '#83abeb',
                rule: '%i === 0'
            },
            {
                backgroundColor: '#c583eb',
                rule: '%i === 1'
            }, {
                backgroundColor: '#e85d6f',
                rule: '%i === 2'
            },
            {
                backgroundColor: '#90eae2',
                rule: '%i === 3'
            },
            {
                backgroundColor: '#f7be70',
                rule: '%i === 4'
            }
            ]
        }
        ]
    };

    zingchart.render({
        id: chartIdName,
        data: chartConfig,
        width: '100%',
        height: '100%',
    });
}

function drawOneShapeletAllDistanceHistogram(aShapeletSelection, aLabelSelection) {

    var twoLabelsTimeseriesIndex = 1;
    var distanceAndStartPositionArrIndex = 2; // According to distanceAll's structure
    var distanceNumIndex = 0; // According to distanceAll's structure

    // console.log("maxAllDistancePerLabelCount:");
    // console.log(maxAllDistancePerLabelCount);
    
    var aDistanceArr = distanceAll[aLabelSelection][aShapeletSelection];
    var a = aDistanceArr[twoLabelsTimeseriesIndex];
    var twoLabelDistanceArr = [];
    /*
    [
        [label0, [[timeseriesNo., [distance, start position]], [timeseriesNo., [distance, start position]], [timeseriesNo., [distance, start position]], ...]],
        [label1, [[timeseriesNo., [distance, start position]], [timeseriesNo., [distance, start position]], [timeseriesNo., [distance, start position]], ...]]
    ]
    */

    var allTimeseriseInfoIndex = 1;
    var distanceAndStartPositionArrIndex = 1;
    var distanceIndex = 0;
    a.forEach(eachLabelTimeseriesArr => {
        var eachLabelDistanceArr = [];
        var b = eachLabelTimeseriesArr[allTimeseriseInfoIndex];
        b.forEach(eachTimeseriesInfo => {
            var aDistance = eachTimeseriesInfo[distanceAndStartPositionArrIndex][distanceIndex];
            eachLabelDistanceArr.push(aDistance);
        });
        twoLabelDistanceArr.push(eachLabelDistanceArr);
    });

    // console.log("twoLabelDistanceArr:");
    // console.log(twoLabelDistanceArr);

    var labelDistanceArrMaxLength = Number.NEGATIVE_INFINITY;
    twoLabelDistanceArr.forEach(eachLabelDistanceArr => {
        var len = eachLabelDistanceArr.length;
        if (len > labelDistanceArrMaxLength) {
            labelDistanceArrMaxLength = len;
        }
    });

    var dataArr = [];
    dataArr.push(['Class 0', 'Class 1']);
    for (var i=0; i<labelDistanceArrMaxLength; i++){
        var anArr = [];
        for (var j=0; j<labelSet.size; j++){ // Since labels start at 0 (Here only two labels)

            var aLabelDistanceArr = twoLabelDistanceArr[j];

            if (i > aLabelDistanceArr.length - 1) {
                var distance = null;
                anArr.push(distance);
            } else {
                var distance = aLabelDistanceArr[i];
                anArr.push(distance);
            }
        }
        dataArr.push(anArr);
    }

    // Define the chart to be drawn.
    // var data = google.visualization.arrayToDataTable([
    //     ['Quarks', 'Leptons'],
    //     [2/3, -1],
    //     [-1/3, 0],
    //     [-1/3, 0],
    //     [-1/3, 0],
    //     [-1/3, 0]
    //   ]);
    var data = google.visualization.arrayToDataTable(
        dataArr
    );

    var myTitle = '[Shapelet no. ' + aShapeletSelection + ' (label no. ' + aLabelSelection + ')]\n\n';

    var options = {
        title: myTitle,
        titleTextStyle: {
            fontSize: 10 // or the number you want
        },
        legend: {
            position: 'top', textStyle: {
                fontSize: 10 // or the number you want
            }
        },
        colors: ['#999999', '#1A8763', '#5C3292', '#871B47'],
        interpolateNulls: false,
        histogram: { lastBucketPercentile: 5, bucketSize: 0.1 }
    };

    //   var options = {
    //     title: 'Approximating Normal Distribution',
    //     legend: { position: 'none' },
    //     colors: ['#4285F4'],

    //     chartArea: { width: 405 },
    //     hAxis: {
    //       ticks: [-1, -0.75, -0.5, -0.25, 0, 0.25, 0.5, 0.75, 1]
    //     },
    //     bar: { gap: 0 },

    //     histogram: {
    //       bucketSize: 0.01,
    //       maxNumBuckets: 400,
    //       minValue: -1,
    //       maxValue: 1
    //     }
    //   };

    // Instantiate and draw the chart.
    var chart = new google.visualization.Histogram(document.getElementById('distanceHistogramChart'));
    chart.draw(data, options);
}


