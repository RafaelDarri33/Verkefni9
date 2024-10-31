import { el, empty } from "./lib/elements.js";
import { weatherSearch } from "./lib/weather.js";

/**
 * @typedef {Object} SearchLocation
 * @property {string} title
 * @property {number} lat
 * @property {number} lng
 */

/**
 * Allar staðsetning sem hægt er að fá veður fyrir.
 * @type Array<SearchLocation>
 */
const locations = [
  {
    title: "Reykjavík",
    lat: 64.1355,
    lng: -21.8954,
  },
  {
    title: "Akureyri",
    lat: 65.6835,
    lng: -18.0878,
  },
  {
    title: "New York",
    lat: 40.7128,
    lng: -74.006,
  },
  {
    title: "Tokyo",
    lat: 35.6764,
    lng: 139.65,
  },
  {
    title: "Sydney",
    lat: 33.8688,
    lng: 151.2093,
  },
];

/**
 * Hreinsar fyrri niðurstöður, passar að niðurstöður séu birtar og birtir element.
 * @param {Element} element
 */
function renderIntoResultsContent(element) {
  const outputElement = document.querySelector(".output");

  if (!outputElement) {
    console.warn("fann ekki .output");
    return;
  }

  empty(outputElement);
  outputElement.appendChild(element);
}

/**
 * Formatar dagsetningu í stílhreina útgáfu.
 * @param {string} isoString - ISO dagsetningarsnið
 * @returns {string} - Formateruð dagsetning
 */
function formatDate(isoString) {
  const date = new Date(isoString);
  return date
    .toLocaleString("is-IS", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })
    .replace(",", "");
}

/**
 * Birtir niðurstöður í viðmóti.
 * @param {SearchLocation} location
 * @param {Array<import('./lib/weather.js').Forecast>} results
 */
function renderResults(location, results) {
  const header = el(
    "tr",
    {},
    el("th", {}, "Tími"),
    el("th", {}, "Hiti"),
    el("th", {}, "Úrkoma")
  );

  const body = results.map((result) =>
    el(
      "tr",
      {},
      el("td", {}, formatDate(result.time)),
      el("td", {}, `${result.temperature}°C`),
      el("td", {}, result.precipitation)
    )
  );

  const resultsTable = el("table", { class: "forecast" }, header, ...body);

  renderIntoResultsContent(
    el(
      "section",
      {},
      el("h2", {}, `Niðurstöður fyrir: ${location.title}`),
      resultsTable
    )
  );
}

/**
 * Birta villu í viðmóti.
 * @param {Error} error
 */
function renderError(error) {
  console.log(error);
  const message = error.message;
  renderIntoResultsContent(el("p", {}, `Villa: ${message}`));
}

/**
 * Birta biðstöðu í viðmóti.
 */
function renderLoading() {
  renderIntoResultsContent(el("p", {}, "Leita..."));
}

/**
 * Framkvæmir leit að veðri fyrir gefna staðsetningu.
 * Birtir biðstöðu, villu eða niðurstöður í viðmóti.
 * @param {SearchLocation} location Staðsetning sem á að leita eftir.
 */
async function onSearch(location) {
  renderLoading();

  let results;
  try {
    results = await weatherSearch(location.lat, location.lng);
  } catch (error) {
    renderError(error);
    return;
  }

  renderResults(location, results ?? []);
}

/**
 * Framkvæmir leit að veðri fyrir núverandi staðsetningu.
 * Biður notanda um leyfi gegnum vafra.
 */
async function onSearchMyLocation() {
  if (!navigator.geolocation) {
    renderError(new Error("Geolocation is not supported by your browser."));
    return;
  }

  renderLoading();

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      const { latitude, longitude } = position.coords;
      let results;

      try {
        results = await weatherSearch(latitude, longitude);
        renderResults({ title: "Núverandi staðsetning" }, results ?? []);
      } catch (error) {
        renderError(error);
      }
    },
    (error) => {
      renderError(new Error(`Villa við að fá staðsetningu: ${error.message}`));
    }
  );
}

/**
 * Býr til takka fyrir staðsetningu.
 * @param {string} locationTitle
 * @param {() => void} onSearch
 * @returns {HTMLElement}
 */
function renderLocationButton(locationTitle, onSearch) {
  const locationElement = el("li", { class: "locations__location" });
  const buttonElement = el(
    "button",
    { class: "locations__button" },
    locationTitle
  );

  buttonElement.addEventListener("click", onSearch);

  locationElement.appendChild(buttonElement);
  return locationElement;
}

/**
 * Býr til grunnviðmót: haus og lýsingu, lista af staðsetningum og niðurstöður (falið í byrjun).
 * @param {Element} container HTML element sem inniheldur allt.
 * @param {Array<SearchLocation>} locations Staðsetningar sem hægt er að fá veður fyrir.
 * @param {(location: SearchLocation) => void} onSearch
 * @param {() => void} onSearchMyLocation
 */
function render(container, locations, onSearch, onSearchMyLocation) {
  const parentElement = document.createElement("main");
  parentElement.classList.add("weather");

  const headerElement = document.createElement("header");
  const heading = document.createElement("h1");
  heading.appendChild(document.createTextNode("Veðrið"));
  headerElement.appendChild(heading);
  parentElement.appendChild(headerElement);

  const introText = el(
    "h2",
    {},
    "Velkomin/n í veðurforritð, Veldu stað til að sjá hita- og úrkomuspá í dag."
  );
  parentElement.appendChild(introText);

  const locationsElement = document.createElement("div");
  locationsElement.classList.add("locations");

  const locationsListElement = document.createElement("ul");
  locationsListElement.classList.add("locations__list");

  const myLocationButton = el("li", { class: "locations__location" });
  const myLocationButtonElement = el(
    "button",
    { class: "locations__button" },
    "Mín staðsetning"
  );

  myLocationButtonElement.addEventListener("click", onSearchMyLocation);
  myLocationButton.appendChild(myLocationButtonElement);
  locationsListElement.appendChild(myLocationButton);

  for (const location of locations) {
    const liButtonElement = renderLocationButton(location.title, () =>
      onSearch(location)
    );
    locationsListElement.appendChild(liButtonElement);
  }

  locationsElement.appendChild(locationsListElement);
  parentElement.appendChild(locationsElement);

  const outputElement = document.createElement("div");
  outputElement.classList.add("output");
  parentElement.appendChild(outputElement);

  container.appendChild(parentElement);
}

render(document.body, locations, onSearch, onSearchMyLocation);
