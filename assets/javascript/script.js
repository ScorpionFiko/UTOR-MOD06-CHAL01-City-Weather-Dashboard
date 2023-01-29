import { openWeatherApiKey } from "./apiKey.js";

let apiKey = openWeatherApiKey();
let storedSearchHistory = [];
let localStorageSearchHistoryName = "searchHistory";
let cityLat = 0;
let cityLon = 0;
let cityState = "";
let cityCountry = "";

function loadStoredSearchHistory() {
    storedSearchHistory = [];
    if (localStorage.getItem(localStorageSearchHistoryName) !== null) {
        storedSearchHistory = JSON.parse(localStorage.getItem(localStorageSearchHistoryName));
    }
}

function populateSearchHistory() {
    storedSearchHistory.forEach((storedSearchItem, index) => {
        $('#selectSearchHistory').append($('<option/>', {
            text: getCityStateCountry(storedSearchItem),
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

function clearSearchHistory() {
    $('#selectSearchHistory option').each(function () {
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


function setupSearchHistory() {
    clearSearchHistory();
    loadStoredSearchHistory();
    populateSearchHistory();
}

function setupWeatherData(cityData) {
    getWeatherData(cityData)
}


function getWeatherData(cityData) {
    let weatherCurrentAPI = "https://api.openweathermap.org/data/2.5/weather?lat=" + cityData.lat + "&lon=" + cityData.lon + "&appid=" + openWeatherApiKey() + "&units=metric";
    let weatherForecastAPI = "https://api.openweathermap.org/data/2.5/forecast?lat=" + cityData.lat + "&lon=" + cityData.lon + "&appid=" + openWeatherApiKey() + "&units=metric";

    let weatherData = [];
    fetch(weatherCurrentAPI).then(function (response) {
        if (response.ok) {
            return response.json();
        }
    }).then(function (currentWeatherData) {
        weatherData.push(currentWeatherData);
        fetch(weatherForecastAPI).then(function (response) {
            if (response.ok) {
                response.json().then(function (weatherForecastData) {
                    weatherForecastData.list.forEach(element => {
                        weatherData.push(element);
                    });
                    renderWeatherData(weatherData);
                    console.log(weatherData);
                }                );
            }
        });
    });



}

function renderWeatherData(weatherData) {
    $('#weatherForecast').empty();
    let weatherRow = $('#weatherForecast').append($('<div>', {
        class: "row justify-content-between",
        id: "weatherRow"
    }));
    for (let i = 0; i < weatherData.length; i = i + 8) {
        let element = weatherData[i];
        let weatherCol = $('#weatherRow').append($('<div>', {
            class: "col-lg-2 col-md-8 col-sm-11 m-3",
            id: "weatherCol" + element.dt
        }));
        let weatherCard = $("#weatherCol" + element.dt).append($('<div>', {
            class: "card",
            id: "weatherCard" + element.dt
        }));
        let weatherCardImg = $("#weatherCard" + element.dt).append($('<img>', {
            class: "card-img-top",
            src: "https://openweathermap.org/img/wn/" + element.weather[0].icon + "@4x.png",
            alt: "image of " + element.weather[0].description,
            id: "weatherCardImg" + element.dt
        }));
        let weatherCardBody = $("#weatherCard" + element.dt).append($('<div>', {
            class: "card-body",
            id: "weatherCardBody" + element.dt
        }));
        let weatherCardBodyH5 = $("#weatherCardBody" + element.dt).append($('<h5>', {
            text: element.weather[0].main,
            class: "card-title"
        }));
        let weatherCardBodyH6 = $("#weatherCardBody" + element.dt).append($('<h6>', {
            text: dayjs(element.dt_txt).format("MMM D, YYYY H:MM:SS"),
            class: "card-subtitle mb-2 text-muted"
        }));

    }




}

function displayCitiesWithSameName(inputCity) {
    // get the coordinates
    getCityCoordinates(inputCity);

}

function getCityCoordinates(inputCity) {
    let coordinatesApi = "http://api.openweathermap.org/geo/1.0/direct?q=" + inputCity + "&appid=" + openWeatherApiKey() + "&limit=5";
    fetch(coordinatesApi).then(function (response) {
        if (response.ok) {
            response.json().then(function (data) {
                if (data.length > 1) {
                    createCityList(data);
                    $("#cityList").modal("show");
                } else if (data.length === 1) {
                    $("#citySearch").modal("hide");
                    $("#inputCitySearch").val("");
                    saveSearchHistory(data[0]);
                    setupSearchHistory();
                    setupHeader(data);
                    setupWeatherData(data[0]);
                } else {
                    alert("City named `" + inputCity + "` is not found!  Please try again!")
                }
            });
        }
    });

}

function setupHeader(city) {
    $("#textCity").text(getCityStateCountry(city) + " Weather");
}

function getCityStateCountry(city) {
    return city.name + ", " + ((city.state != undefined) ? city.state + ", " : "") + city.country
}

function getCityId(city) {
    return btoa(
        city.name + city.state + city.country + city.lat + city.lon
    ).replace(/=/g, "");
}

function createCityList(cityList) {
    $('#cityListSelector').text('');
    cityList.forEach((city, index) => {
        let cityID = getCityId(city);
        if ($('#' + cityID).length === 0) {
            $('#cityListSelector').append($('<a/>', {
                text: getCityStateCountry(city),
                id: "list-"+cityID,
                href: "#",
                dataset: JSON.stringify({ id: "test" })
            }));
            $('#list-' + cityID).attr("data-id", cityID);
            $('#list-' + cityID).attr("data-name", city.name);
            $('#list-' + cityID).attr("data-lat", city.lat);
            $('#list-' + cityID).attr("data-lon", city.lon);
            $('#list-' + cityID).attr("data-state", city.state);
            $('#list-' + cityID).attr("data-country", city.country);
            $('#list-' + cityID).addClass("list-group-item-action");
        }
    });

}

$(function () {
    setupSearchHistory();


    $("#btnSearch").on("click", function (event) {
        event.preventDefault();
        event.stopPropagation();

        let searchCity = $("#inputCitySearch").val().trim();
        if (searchCity !== "") {
            displayCitiesWithSameName(searchCity);


        } else {
            alert("Please enter a city");
        }
    });

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

        if (historyCity.id !== "") {
            setupWeatherData(historyCity);
            setupHeader(historyCity);
            $("#citySearch").modal('hide');
            $("#inputCitySearch").val("");
        }
    });

    $("#cityListSelector").on("click", function (event) {
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
            setupHeader(chosenCity.dataset);
            setupWeatherData(chosenCity.dataset);
        }
    });

    $("#btnClose").on("click", function (event) {
        event.preventDefault();
        event.stopPropagation();

        $("#inputCitySearch").val("");
    });
});