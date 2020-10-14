// Load timeseries dataset
var globalLines;

loadTimeseries();

function loadTimeseries() {
    $(document).ready(function () {
        $.ajax({
            type: "GET",
            url: "/src/ItalyPowerDemand0_TEST",
            dataType: null,
            success: function (data) { processData(data); }
        });
    });
}

function processData(allText) {
    var record_num = 25;  // or however many elements there are in each row
    var allTextLines = allText.split(/\r\n|\n/);
    var lines = [];

    allTextLines.forEach(element => {

        var entries = element.split(',');

        while (entries.length >= record_num) {
            var tarr = [];
            for (var j = 0; j < record_num; j++) {
                tarr.push(entries.shift());
            }
            lines.push(tarr);
        }
    });
    console.log(lines)
    globalLines = lines;
}

/*------------------------------------------------------------*/


google.charts.load('current', { 'packages': ['corechart'] });
google.charts.setOnLoadCallback(drawChart);

function drawChart() {

    var record_num = 25;  // or however many elements there are in each row

    var arrTest_1 = globalLines[0];
    var arrTest_2 = globalLines[1];
    var arr = [];

    for (i = 0; i < record_num; i++) {
        if(i==0){
            arr.push(['Year', 'Sales', 'Expenses']);
        }else{
            var localArr = [];
            localArr.push(parseFloat(i));
            localArr.push(parseFloat(arrTest_1[i]));
            localArr.push(parseFloat(arrTest_2[i]));
            arr.push(localArr);
        }
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
        title: 'Company Performance',
        curveType: 'function',
        legend: { position: 'bottom' }
    };

    var chart = new google.visualization.LineChart(document.getElementById('curve_chart'));

    chart.draw(data, options);
}


google.charts.load('current', { packages: ['corechart', 'bar'] });
google.charts.setOnLoadCallback(drawRightY);

function drawRightY() {
    var data = google.visualization.arrayToDataTable([
        ['City', '2010 Population', '2000 Population'],
        ['New York City, NY', 8175000, 8008000],
        ['Los Angeles, CA', 3792000, 3694000],
        ['Chicago, IL', 2695000, 2896000],
        ['Houston, TX', 2099000, 1953000],
        ['Philadelphia, PA', 1526000, 1517000]
    ]);

    var materialOptions = {
        chart: {
            title: 'Population of Largest U.S. Cities',
            subtitle: 'Based on most recent and previous census data'
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


// var csv = require('./jquery.csv.js');


