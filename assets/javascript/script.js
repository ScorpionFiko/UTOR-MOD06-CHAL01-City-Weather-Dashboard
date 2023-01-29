// gets the API key from a separate file
import { openWeatherApiKey } from "./apiKey.js";
let apiKey = openWeatherApiKey();

// local working variables
let storedSearchHistory = [];
let units = "metric"; // defaulting to metric
// name of the localStorage variable that will be used throughout
let localStorageSearchHistoryName = "searchHistory";


// functions to load the search history in the search history select dropdown
function setupSearchHistory() {
    loadStoredSearchHistory();
    populateSearchHistory();
}
// loading any previous search history
function loadStoredSearchHistory() {
    storedSearchHistory = [];
    if (localStorage.getItem(localStorageSearchHistoryName) !== null) {
        storedSearchHistory = JSON.parse(localStorage.getItem(localStorageSearchHistoryName));
    }
}
// populating the search history drop down
// first clears and add the "select from search history" option -> default selection; 
// then adds the remainder of the history
function populateSearchHistory() {
    $('#selectSearchHistory').empty();
    $('#selectSearchHistory').append($('<option/>', {
        html: "select from search history",
        value: 0,
        id: "history-item",

    }));

    storedSearchHistory.forEach((storedSearchItem, index) => {
        $('#selectSearchHistory').append($('<option/>', {
            html: getCityStateCountry(storedSearchItem),
            id: "history-" + storedSearchItem.id
        }));
        $('#history-' + storedSearchItem.id).attr("data-id", storedSearchItem.id);
        $('#history-' + storedSearchItem.id).attr("data-name", storedSearchItem.name);
        $('#history-' + storedSearchItem.id).attr("data-state", storedSearchItem.state);
        $('#history-' + storedSearchItem.id).attr("data-country", storedSearchItem.country);
        $('#history-' + storedSearchItem.id).attr("data-lat", storedSearchItem.lat);
        $('#history-' + storedSearchItem.id).attr("data-lon", storedSearchItem.lon);
    });
}
// adds the new city to the search history and stores it in localstorage
// if the city exists, nothing is added
function saveSearchHistory(cityData) {
    // geting unique ID based on city and coordinates
    let cityID = getCityId(cityData);

    if (storedSearchHistory.findIndex(city => city.id === cityID) < 0) {
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
// fetches the current and 5 day forecast weather data and combines them into a single array 
function getWeatherData(cityData) {
    if ($("#unitSlider").val() === "0") {
        units = "metric";
    } else {
        units = "imperial"
    }
    let weatherCurrentAPI = "https://api.openweathermap.org/data/2.5/weather?lat=" + cityData.lat + "&lon=" + cityData.lon + "&appid=" + openWeatherApiKey() + "&units=" + units;
    let weatherForecastAPI = "https://api.openweathermap.org/data/2.5/forecast?lat=" + cityData.lat + "&lon=" + cityData.lon + "&appid=" + openWeatherApiKey() + "&units=" + units;

    let weatherData = [];
    fetch(weatherCurrentAPI).then(function (response) {
        if (response.ok) {
            return response.json();
        }
    }).then(function (currentWeatherData) {
        weatherData.push(currentWeatherData);
        fetch(weatherForecastAPI).then(function (response) {
            if (response.ok) {
                return response.json()
            }
        }).then(function (weatherForecastData) {
            weatherForecastData.list.forEach(element => {
                weatherData.push(element);
            });
            renderWeatherData(weatherData);
            console.log(weatherData);
        }).catch((error) => {
            alert("There was an error fetching the weather conditions! Please try again later!");
            console.log('Error:' + error);
        });

    }).catch((error) => {
        alert("There was an error fetching the weather conditions! Please try again later!");
        console.log('Error:' + error);
    });
}
// displays current and forecast weather data onto the screen in bootsrtap cards
function renderWeatherData(weatherData) {
    if (weatherData.length === 0) {
        return;
    }
    $('#weatherForecast').empty();
    $('#weatherForecast').append($('<div>', {
        class: "row justify-content-between  align-items-stretch w-100",
        id: "weatherRow"
    }));
    // weather array has 5 day forcase in 3 hour intervals; therefore, every 8th entry is picked up
    for (let i = 0; i < weatherData.length; i += 8) {
        let element = weatherData[i];
        // appending column to the row
        $('#weatherRow').append($('<div>', {
            class: "col-lg-2 col-md-3 col-sm-5 m-3 d-flex align-items-stretch justify-content-center",
            id: "weatherCol" + element.dt
        }));
        // appending card to the column
        $("#weatherCol" + element.dt).append($('<div>', {
            class: "card w-100",
            id: "weatherCard" + element.dt
        }));
        // appending card body to the card
        $("#weatherCard" + element.dt).append($('<div>', {
            class: "card-body",
            id: "weatherCardBody" + element.dt
        }));
        // appending title to the card body
        $("#weatherCardBody" + element.dt).append($('<h5>', {
            html: ((i === 0) ? "CURRENT<br>" : "") + dayjs(dayjs.unix(element.dt)).format("MMM D, YYYY h:mm a"),
            class: "card-title"
        }));
        // appending image to the card body
        $("#weatherCardBody" + element.dt).append($('<img>', {
            class: "card-img-top",
            src: "https://openweathermap.org/img/wn/" + element.weather[0].icon + "@4x.png",
            alt: "image of " + element.weather[0].description,
            id: "weatherCardImg" + element.dt
        }));
        // appending weather description
        $("#weatherCardBody" + element.dt).append($('<h6>', {
            html: element.weather[0].description,
            class: "card-subtitle mb-2 text-muted capitalize"
        }));
        // appending temp to the card body
        $("#weatherCardBody" + element.dt).append($('<h5>', {
            html: '<i class="fas fa-temperature-high"></i> ' + element.main.temp + "&deg;" + ((units === "metric") ? "C" : "F"),
            class: "card-title"
        }));
        // appending humidity to the card body
        $("#weatherCardBody" + element.dt).append($('<h5>', {
            html: '<i class="fas fa-water"></i> ' + element.main.humidity + "%",
            class: "card-title"
        }));
        // appending wind to the card body
        $("#weatherCardBody" + element.dt).append($('<h5>', {
            html: '<i class="fas fa-wind"></i> ' + element.wind.speed + ((units === "metric") ? "kph" : "mph"),
            class: "card-title"
        }));

    }
}
// fetches the city coordinates and if there's more than one displays an additional list
// otherwise takes the user to the weather data
function getCityCoordinates(inputCity) {
    let coordinatesApi = "http://api.openweathermap.org/geo/1.0/direct?q=" + inputCity + "&appid=" + openWeatherApiKey() + "&limit=5";
    fetch(coordinatesApi).then(function (response) {
        if (response.ok) {
            return response.json();
        }
    }).then(function (data) {
        if (data.length > 1) {
            createCityList(data);
            $("#cityList").modal("show");
        } else if (data.length === 1) {
            $("#citySearch").modal("hide");
            $("#inputCitySearch").val("");
            saveSearchHistory(data[0]);
            setupSearchHistory();
            setupHeader(data[0]);
            getWeatherData(data[0]);
        } else {
            alert("City named `" + inputCity + "` is not found!  Please try again!")
        }
    }).catch((error) => {
        alert("There was an error fetching the city coordinates! Please try again later!");
        console.log('Error:' + error);
    });


}
// function to change the header to the city
function setupHeader(city) {
    $("#textCity").text(getCityStateCountry(city) + " Weather");
}
// function to get the city, state, and country concatinated
function getCityStateCountry(city) {
    return city.name + ", " + ((city.state != undefined) ? city.state + ", " : "") + city.country
}
// function that creates a unique ID for each city. it is based on city name, state, country, lattitue, and longitude. All "=" are stripped form the base 64 encoded string as jQuery does not recognize them as valid
function getCityId(city) {
    return btoa(
        city.name + city.state + city.country + city.lat + city.lon
    ).replace(/=/g, "");
}
// creates the seconday modal box with the listing of the cities with similar names
// displays the city state and country
function createCityList(cityList) {
    $('#cityListSelector').empty();
    cityList.forEach((city, index) => {
        let cityID = getCityId(city);
        $('#cityListSelector').append($('<a/>', {
            text: getCityStateCountry(city),
            id: "list-" + cityID,
            href: "#",
        }));
        $('#list-' + cityID).attr("data-id", cityID);
        $('#list-' + cityID).attr("data-name", city.name);
        $('#list-' + cityID).attr("data-lat", city.lat);
        $('#list-' + cityID).attr("data-lon", city.lon);
        $('#list-' + cityID).attr("data-state", city.state);
        $('#list-' + cityID).attr("data-country", city.country);
        $('#list-' + cityID).addClass("list-group-item-action");
    });

}

// main function for all activities
$(function () {
    // sets up the search history
    setupSearchHistory();
    // adds event listener on the search button from the main modal box
    $("#btnSearch").on("click", function (event) {
        event.preventDefault();
        event.stopPropagation();

        let searchCity = $("#inputCitySearch").val().trim();
        if (searchCity !== "") {
            getCityCoordinates(searchCity);
        } else {
            alert("Please enter a city");
        }
    });
    // adds event listener to the X button to close the main modal box
    $("#btnClose").on("click", function (event) {
        event.preventDefault();
        event.stopPropagation();
        $("#inputCitySearch").val("");
    });
    // adds event listener to the search history select box. 
    $("#selectSearchHistory").on("change", function (event) {
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
        // checks is the user has clicked on a city or the title 
        if (historyCity.id !== "") {
            setupHeader(historyCity);
            getWeatherData(historyCity);
            $("#citySearch").modal('hide');
            $("#inputCitySearch").val("");
            $("#selectSearchHistory").val("0");
        }
    });
    // adds event listener for the multiple city modal box
    $("#cityListSelector").on("click", function (event) {
        event.preventDefault();
        event.stopPropagation();

        let chosenCity = event.target;
        if (chosenCity.dataset.id != undefined) {
            // removes the modals from view
            $("#cityList").modal("hide");
            $("#citySearch").modal("hide");
            $("#inputCitySearch").val("");
            saveSearchHistory(chosenCity.dataset);
            setupSearchHistory();
            setupHeader(chosenCity.dataset);
            getWeatherData(chosenCity.dataset);
        }
    });
});