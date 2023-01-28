let storedSearchHistory = [];
let localStorageSearchHistoryName = "searchHistory";

function loadStoredSearchHistory() {
    storedSearchHistory = [];
    if (localStorage.getItem(localStorageSearchHistoryName) !== null) {
        storedSearchHistory= JSON.parse(localStorage.getItem(localStorageSearchHistoryName));
    }
}

function populateSearchHistory() {
    storedSearchHistory.forEach((storedSearchItem, index) => {
        $('#selectSearchHistory').append($('<option/>', {
            text: storedSearchItem,
            value: storedSearchItem,
            id: "searchHistory-" + index
        }));
        $('#searchHistory-' + index).attr("data-city", storedSearchItem);
    });
}

function clearSearchHistory() {
    $('#selectSearchHistory option').each(function() {
        $(this).remove();
    });
    let selectOptionText = "search history";
    $('#selectSearchHistory').append($('<option/>', {
        text: selectOptionText,
        value: 0,
        id: "searchHistory-item"
    }));
    $('#searchHistory-item').attr("data-city", "");
}

function saveSearchHistory(searchCity) {
    if (storedSearchHistory.findIndex(city => city === searchCity) < 0 ) {
        storedSearchHistory.push(searchCity);
        localStorage.setItem(localStorageSearchHistoryName, JSON.stringify(storedSearchHistory));
    }
}


function setupSearchHistory() {
    clearSearchHistory();
    loadStoredSearchHistory();
    populateSearchHistory();
}

function setupWeatherData(inputCity) {
    console.log("setting up weather data for " + inputCity);
}

$(function() {
    setupSearchHistory();


    $("#btnSearch").on("click", function() {
        let searchCity = $("#inputCitySearch").val().trim();
        if (searchCity !== "") {
            saveSearchHistory(searchCity);
            setupSearchHistory();
            setupWeatherData(searchCity);
    
        } else {
            alert("Please enter a city");
        }
    });

    $("#selectSearchHistory").on("change" , function(){
        let historyCity = $("#selectSearchHistory :selected").attr("data-city");
        if (historyCity !== "") {
            setupWeatherData(historyCity);
            $("#citySearch").modal('hide');
        }
    });
} );