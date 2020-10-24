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

loadTimeseries();
loadShapelet();
readShapeletWeight();

window.onload = function () {
    loadList();
    // updateList(1);
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
    console.log(lines);

    if (type.toLowerCase() == "timeseries") {
        globalLinesTimeseries = lines;
    } else if (type.toLowerCase() == "shapelet") {
        globalLinesShapelet = lines;
    } else if (type.toLowerCase() == "shapeletweight") {
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
            distanceBetweenST += Math.pow(aTimeseries[j + i] - aShapelet[j], 2.0);
        }
        distanceBetweenST = Math.sqrt(distanceBetweenST);

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
    return startPosition;
}


/*------------------------------------------------------------*/


google.charts.load('current', { 'packages': ['corechart'] });
google.charts.setOnLoadCallback(drawChart);

function drawChart() {

    var arrTest_1 = globalLinesTimeseries[0][1];
    var arrTest_2 = globalLinesShapelet[0][1];
    var record_num;  // how many elements there are in each row
    var arr = [];

    if (arrTest_1.length > arrTest_2.length) {
        record_num = arrTest_1.length;
    } else {
        record_num = arrTest_2.length;
    }

    // console.log(globalLinesTimeseries.length);
    // console.log(globalLinesShapelet.length);

    var shapeletStartPosition = getShortestDistance(globalLinesTimeseries[0][1], globalLinesShapelet[0][1]);

    for (i = 0; i < record_num; i++) {

        if (i == 0) {
            arr.push(['Time Interval', 'Shapelets', 'Timeseries']);
        }

        var localArr = [];
        localArr.push(parseFloat(i));
        localArr.push(parseFloat(arrTest_1[i]));

        if (i < shapeletStartPosition || i > shapeletStartPosition + arrTest_2.length) {
            localArr.push(null);
        } else {
            localArr.push(parseFloat(arrTest_2[i]));
        }

        arr.push(localArr);

        // text += cars[i] + "<br>";
    }

    var data = google.visualization.arrayToDataTable(
        // [
        //     ['Year', 'Sales', 'Expenses'],
        //     ['2004', 1000, null],
        //     ['2005', 1170, 460],
        //     ['2006', 660, 1120],
        //     ['2007', 1030, 540],
        //     ['2008,', 2010, 760],
        //     ['2009,', 2350, 460],
        // ]
        arr
    );

    var options = {
        title: 'Timeseries Analysis',
        curveType: 'function',
        legend: { position: 'bottom' }
    };

    var chart = new google.visualization.LineChart(document.getElementById('curve_chart'));

    chart.draw(data, options);
}

function updateChart(num1, num2) {
    const dim = 1; // The 0 dimension is lable data, the 1 dimension is timeseries data
    var arrTest_1 = globalLinesTimeseries[num1][dim];
    var arrTest_2 = globalLinesShapelet[num2][dim];
    var record_num;  // how many elements there are in each row
    var arr = [];

    if (arrTest_1.length > arrTest_2.length) {
        record_num = arrTest_1.length;
    } else {
        record_num = arrTest_2.length;
    }

    // console.log(globalLinesTimeseries.length);
    // console.log(globalLinesShapelet.length);

    var shapeletStartPosition = getShortestDistance(globalLinesTimeseries[0][1], globalLinesShapelet[0][1]);

    for (i = 0; i < record_num; i++) {

        if (i == 0) {
            arr.push(['Time Interval', 'Shapelets', 'Timeseries']);
        }

        var localArr = [];
        localArr.push(parseFloat(i));
        localArr.push(parseFloat(arrTest_1[i]));

        if (i < shapeletStartPosition || i > shapeletStartPosition + arrTest_2.length) {
            localArr.push(null);
        } else {
            localArr.push(parseFloat(arrTest_2[i]));
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


function loadList() {

    const div = document.querySelector('#timeseriesList');
    var len = globalLinesTimeseries.length;

    for (var i = 0; i < len; i++) {
        var item = document.createElement("a");
        item.setAttribute("class", "dropdown-item");
        item.href = "#";
        var node = document.createTextNode(String(i)) /*fetching name of the items*/
        item.appendChild(node);
        document.getElementById('timeseriesList').appendChild(item);
    }

    var elements = document.getElementsByClassName('dropdown-item');

    Array.from(elements).forEach((element) => {
        element.addEventListener('click', (event) => {
            // alert(`Clicked ${event.target.innerText}!`);
            updateChart(parseInt(event.target.innerText), 0);
        });
    });
}

function updateList(num) {

    const div = document.querySelector('#timeseriesList');
    const dim = 1; // The 0 dimension is lable data, the 1 dimension is timeseries data

    var len = globalLinesTimeseries[dim][lable].length;

    for (var i = 0; i < len; i++) {
        var item = document.createElement("a");
        item.setAttribute("class", "dropdown-item");
        item.href = "#";
        var node = document.createTextNode(String(i)) /*fetching name of the items*/
        item.appendChild(node);
        document.getElementById('timeseriesList').appendChild(item);
    }
}


