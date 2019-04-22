//Pre-allocate variables
var zipCodeCSVarray, zipCodeCSVstring, zipCodeListArray, tableControl, incomeInput, zipCodeListString, markerZipCodeString ,markerZipCodeArray;
var outputDivString = "";
var map, markers;

//On document fully loaded
$(document).ready(function ()
{
	//Initialize DataTable
    tableControl = $('#outputTable').DataTable({
        responsive: true,
        fixedHeader: true,
    });

	//Show only DIV for step 1
    $('#step2').hide();
    $('#step3').hide();
    $('#step4').hide();
    $('#step5').hide();
});

// Delete Row on clicking button
function deleteRow(button)
{
	//Find the ZipCode to delete from button's data
    var zipCode = tableControl.row($(button).parents('tr')).data()[0];
    var temp = "";

    if (zipCodeListString.indexOf("," + zipCode + ",") > -1)
    {
        temp = "," + zipCode;
    }
    else
    {
        temp = "" + zipCode + ",";
    }

	//Remove zipcode from the final zipCodeListString, the Google Map, and finally the actual table
    zipCodeListString = zipCodeListString.replace(temp, "");
    removeMarker(tableControl.row($(button).parents('tr')).data()[0]);
    tableControl.row($(button).parents('tr')).remove().draw(false);
}

// Step 1: Load Zip Code CSV
// Asking for the User's input CSV with a list of all possible US Zip Codes and their average income.
function loadZipCodeCSV(files)
{
    // Load up a FileReader to get the CSV
    var reader = new FileReader();
    reader.onload = function (event)
    {
        zipCodeCSVstring = event.target.result;
        outputDivString += "&nbsp&nbspCSV Loaded!<br />";
        $('#outputDiv').html(outputDivString);
    };
    reader.onerror = function () { alert('Unable to read ' + file.fileName); };
    reader.readAsText(files[0]);

	//Load all possible US ZipCodes from file
    loadMarkerZipCodes();

	//Initialize next step
    $('#step1').hide();
    $('#step2').show();
}

// Step 2: Pull Zip Codes automatically
// Here we use the User's input to pull all ZipCodes close to the User's ZipCode based on a given distance
function pullZipCodes()
{
	//Initialize DIVs on index.html to show webpage is doing work
    setMapCenter($('#zipCodeInput').val());
    outputDivString += "&nbsp&nbspWorking...<br />";
    $('#outputDiv').html(outputDivString);
    $('#pullZipCodeButton').prop('disabled', true);

	//CODE REDACTED DUE TO PROPRIETARY USAGE
	//CODE REDACTED DUE TO PROPRIETARY USAGE
    var zipCodeURI = "";
	//CODE REDACTED DUE TO PROPRIETARY USAGE
	//CODE REDACTED DUE TO PROPRIETARY USAGE

	//Get the JSON data from a custom URL that returns ZipCode information
    $.getJSON(zipCodeURI, function (data)
    {
		//Initialize our regex function to find the structure of a ZipCode and turn JSON data into a string to be tested against the regex
        var re = /[0-9][0-9][0-9][0-9][0-9]<\/a>/g;
        var str = "" + data.contents;
        var arr;
        zipCodeListArray = [];
        var counter = 0;

		//For every instance of a positive regex result (a ZipCode) in our data
        while ((arr = re.exec(str)) !== null)
        {
			//Add the ZipCode to the ZipCodeListArray
            zipCodeListArray.push(str.substr(arr.index, 5));
            counter++;
        }

		//Initialize next step
        outputDivString += "&nbsp&nbspList Loaded " + counter + " Zip Codes!<br />";
        $('#outputDiv').html(outputDivString);
        $('#step2').hide();
        $('#step3').show();

    });
}
// Step 3: button (income text field)
function setIncome()
{
	//When the Step3 button is pushed we know the user had finished setting the Income Threshold text box
	//Initialize next step
    outputDivString += "&nbsp&nbspIncome Set!<br />";
    $('#outputDiv').html(outputDivString);
    $('#step3').hide();
    $('#step4').show();
}

// Step 4: Load Table
function loadTable()
{
	//Initialize output DIV to show website is working, and pull the user info from previous steps text fields
    var number1, number2;
    outputDivString += "Working...<br />";
    $('#outputDiv').html(outputDivString);
    zipCodeListString = "";
    var incomeInput = document.getElementById('incomeInput').value;
    zipCodeCSVarray = [];
    zipCodeCSVarray = $.csv.toArrays(zipCodeCSVstring);
    
	//For every ZipCode pulled from our special JSON data
    for (var i = 0; i < zipCodeListArray.length; i++)
    {
		//For every ZipCode in the list of ZipCodes and their income levels
        for (var j = 4; j < zipCodeCSVarray.length; j++)
        {
            number1 = Number(zipCodeCSVarray[j][4].replace(/[^0-9.-]+/g, ""));
            number2 = Number(incomeInput.replace(/[^0-9.-]+/g, ""));

			//If the Zipcodes match
            if (zipCodeListArray[i] === zipCodeCSVarray[j][0] && number1 >= number2)
            {
				//Add the zipcode to the final zipCodeListString
                if (tableControl.column(0).data().length === 0)
                {
                    zipCodeListString += zipCodeCSVarray[j][0];
                }
                else
                {
                    zipCodeListString += "," + zipCodeCSVarray[j][0];
                }

				//Add a marker on the map for the found ZipCode
                setMarker(zipCodeCSVarray[j][0]);

				//Add a row in the table for the given ZipCode
                tableControl.row.add([
                    zipCodeCSVarray[j][0],
                    zipCodeCSVarray[j][3],
                    zipCodeCSVarray[j][2],
                    zipCodeCSVarray[j][1],
                    zipCodeCSVarray[j][4],
                     //zipCodeCSVarray[j][5],
                    zipCodeCSVarray[j][6],
                    //zipCodeCSVarray[j][7],
                    zipCodeCSVarray[j][8],
                    //zipCodeCSVarray[j][9],
                    zipCodeCSVarray[j][10] + "%",
                    "<input type='button' value='Delete' onclick='deleteRow(this)' />"
                ]);
                break;
            }
        }
    }

	//Fix DIV output and draw datatable
    outputDivString += "Table Loaded!!!";
    $('#outputDiv').html(outputDivString);
    tableControl.draw(false);

	//Initialize next step
    $('#step4').hide();
    $('#step5').show();
}

// Step 5: Copy Zip Code list to clipboard
function copyToClipboard()
{
	//Pull the zipCodeListString which is a list of ZipCodes in the table, and give it to the User's clipboard
    var $temp = $("<input>");
    $("body").append($temp);
    $temp.val(zipCodeListString).select();
    document.execCommand("copy");
    $temp.remove();
    $('#copyToClipboardOutput').html("&nbsp&nbsp Zip Codes copied!");
}

//-----------------------------------------------
//--------------- MAP FUNCTIONS -----------------

//Initialize Google Map DIV
function initMap()
{
    map = new google.maps.Map(document.getElementById('map'), {
        center: { lat: 40.7, lng: -74 },
        zoom: 11
    });
    
    markers = [];
}

//Set the Google Map center based on a given ZipCode
function setMapCenter(zipCode)
{
    var geocoder = new google.maps.Geocoder();
    geocoder.geocode({ componentRestrictions: { country: 'US', postalCode: zipCode } }, function (results, status)
    {
        if (status === 'OK')
        {
            if (results[0])
            {
                map.setCenter(results[0].geometry.location);
            }
            else
            {
                window.alert('No results found');
            }
        } else
        {
            window.alert('Geocoder failed due to: ' + status);
        }
    });
}

//Load all of the possible US ZipCodes from file into an array to be used later
function loadMarkerZipCodes()
{
    $.ajax({
        url: "us-zip-codes.txt", success: function (result)
        {
            markerZipCodeString = "" + result;
            markerZipCodeArray = $.csv.toArrays(markerZipCodeString);
        }
    });
}

//Simple binary search algorithm
function binarySearch(list, value)
{
    let start = 0;
    let stop = list.length - 1;
    let middle = Math.floor((start + stop) / 2);
    
    while (list[middle][0] !== value && start < stop)
    {
        if (value < list[middle][0])
        {
            stop = middle - 1;
        } else
        {
            start = middle + 1;
        }
        
        middle = Math.floor((start + stop) / 2);
    }
    
    return (list[middle][0] !== value) ? -1 : middle;
}

//Set a marker on the Google Map based on a given ZipCode
function setMarker(zipCode)
{
    var markerPosition = binarySearch(markerZipCodeArray, zipCode);
    if (markerPosition < 0)
    {
        alert("Missing Latitude and Longitude for zip code:" + zipCode);
    }
    else
    {
        var myLatLng = new google.maps.LatLng(markerZipCodeArray[markerPosition][1], markerZipCodeArray[markerPosition][2]);

        var marker = new google.maps.Marker({
            position: myLatLng,
            label: zipCode,
            map: map
        });
        markers.push([zipCode, marker]);
    }
    
}

//Delete a marker from the Google Map based on a given ZipCode
function removeMarker(zipCode)
{
    for (var i = 0; i < markers.length; i++)
    {
        if (markers[i][0] === zipCode)
        {
            markers[i][1].setMap(null);
        }
    }
}

//Test Bed function for debugging while developing
function testRun()
{
}