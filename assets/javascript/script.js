import { openWeatherApiKey } from "./apiKey.js"; 

let apiKey = openWeatherApiKey();
let storedSearchHistory = [];
let localStorageSearchHistoryName = "searchHistory";
let cityLat = 0;
let cityLon = 0;
let cityState ="";
let cityCountry = "";

function loadStoredSearchHistory() {
    storedSearchHistory = [];
    if (localStorage.getItem(localStorageSearchHistoryName) !== null) {
        storedSearchHistory= JSON.parse(localStorage.getItem(localStorageSearchHistoryName));
    }
}

function populateSearchHistory() {
    storedSearchHistory.forEach((storedSearchItem, index) => {
        $('#selectSearchHistory').append($('<option/>', {
            text: getCityStateCountry(storedSearchItem),
            id: storedSearchItem.id
        }));
        $('#' + storedSearchItem.id).attr("data-id", storedSearchItem.id);
        $('#' + storedSearchItem.id).attr("data-name", storedSearchItem.name);
        $('#' + storedSearchItem.id).attr("data-state", storedSearchItem.state);
        $('#' + storedSearchItem.id).attr("data-country", storedSearchItem.country);
        $('#' + storedSearchItem.id).attr("data-lat", storedSearchItem.lat);
        $('#' + storedSearchItem.id).attr("data-lon", storedSearchItem.lon);
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
    $('#searchHistory-item').attr("data-name", "");
}

function saveSearchHistory(cityData) {
    // geting unique ID based on city and coordinates
    let cityID = getCityId(cityData);

    if (storedSearchHistory.findIndex(city => city.id === cityID) < 0 ) {
        storedSearchHistory.push({
            id: cityID,
            name: cityData.name,
            lat: cityData.lat,
            lon: cityData.lon,
            state: cityData.state,
            country: cityData.country
        });
        localStorage.setItem(localStorageSearchHistoryName, JSON.stringify(storedSearchHistory));
    }
}


function setupSearchHistory() {
    clearSearchHistory();
    loadStoredSearchHistory();
    populateSearchHistory();
}

function setupWeatherData(cityData) {
    getWeatherData(cityData)
}


function getWeatherData(cityData) {
    let weatherAPI = "https://api.openweathermap.org/data/2.5/forecast?lat=" + cityData.lat + "&lon=" + cityData.lon + "&appid=" + openWeatherApiKey() + "&units=metric";

    fetch(weatherAPI).then(function (response) {
        if (response.ok) {
            response.json().then(function (weatherData) {
                console.log(weatherData);
            });
        }
    });
}

function renderWeatherData() {

}

function displayCitiesWithSameName(inputCity) {
    // get the coordinates
    getCityCoordinates(inputCity);
    
}

function getCityCoordinates(inputCity) {
    let coordinatesApi = "http://api.openweathermap.org/geo/1.0/direct?q=" + inputCity + "&appid=" + openWeatherApiKey() + "&limit=5";
    fetch(coordinatesApi).then(function(response) {
        if (response.ok) {
            response.json().then(function (data) {
              if (data.length > 1) {
                createCityList(data);
                $("#cityList").modal("show");
              }  else if (data.length === 1) {
                $("#citySearch").modal("hide");
                $("#inputCitySearch").val("");
                saveSearchHistory(data[0]);
                setupSearchHistory();
                setupWeatherData(data[0]);
              } else {
                alert("City named `" + inputCity + "` is not found!  Please try again!")
              }
            });
        }
    });

}

function getCityStateCountry(city) {
    return city.name + ", " + ((city.state != undefined) ? city.state + ", " : "")  + city.country
}

function getCityId(city) {
    return btoa(
        city.name + city.state + city.country + city.lat + city.lon
    ).replace(/=/g,"");
}

function createCityList(cityList) {
    $('#cityListSelector').text('');
    cityList.forEach((city, index ) => {
        let cityID = getCityId(city);
        $('#cityListSelector').append($('<a/>', {
                text: getCityStateCountry(city),
                id: cityID,
                href:"#"
            }));
            $('#' + cityID).attr("data-id", cityID);
            $('#' + cityID).attr("data-name", city.name);
            $('#' + cityID).attr("data-lat", city.lat);
            $('#' + cityID).attr("data-lon", city.lon);
            $('#' + cityID).attr("data-state", city.state);
            $('#' + cityID).attr("data-country", city.country);
            $('#' + cityID).addClass("list-group-item-action");
    });

}

$(function() {
    setupSearchHistory();


    $("#btnSearch").on("click", function(event) {
        event.preventDefault();
        event.stopPropagation();

        let searchCity = $("#inputCitySearch").val().trim();
        if (searchCity !== "") {
            displayCitiesWithSameName(searchCity);
            
    
        } else {
            alert("Please enter a city");
        }
    });

    $("#selectSearchHistory").on("change" , function(event){
        event.preventDefault();
        event.stopPropagation();
        let selectedEl = $("#selectSearchHistory :selected");
        let historyCity = {
            id: selectedEl.attr("data-id"),
            name: selectedEl.attr("data-name"),
            lat: selectedEl.attr("data-lat"),
            lon: selectedEl.attr("data-lon"),
            state: selectedEl.attr("data-state"),
            country: selectedEl.attr("data-country")
        };

        if (historyCity.id !== "") {
            setupWeatherData(historyCity);
            $("#citySearch").modal('hide');
            $("#inputCitySearch").val("");
        }
    });

    $("#cityListSelector").on("click", function(event) {
        event.preventDefault();
        event.stopPropagation();

        let chosenCity = event.target;
        if (chosenCity.dataset.name != undefined) {
            //save
          $("#cityList").modal("hide");
          $("#citySearch").modal("hide");
          $("#inputCitySearch").val("");
          saveSearchHistory(chosenCity.dataset);
          setupSearchHistory();
          setupWeatherData(chosenCity.dataset);
        }
    });

    $("#btnClose").on("click", function (event) {
        event.preventDefault();
        event.stopPropagation();

        $("#inputCitySearch").val("");
    });
} );