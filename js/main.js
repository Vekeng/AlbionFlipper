//Global values
const items = getAllItems();
var totalProgress = 0; //All fetches add to this a value of 0.0-1.0 for their progress in fetching.
var totalFetches = 0; //Fetches running or consecutively started
var tier;
var server; 
var enchantment;
var quality;
var maxAgeBM;
var maxAgeCity;
var minProfit;
const POSITIVE_VALUE_LARGE = 2147483647;
const NEGATIVE_VALUE_LARGE = -2147483647;
const ONE_WEEK = 10080; // change this to maxAgeCity if you don't want Caerleon properties to ignore maxAgeCity
var profitableTrades = 0;
var freshTrades = 0;
var totalApprovedTrades = 0;
var currentUTCTime; 


//Takes the raw items string and converts it into array of an objects
function getAllItems() {
  var a = raw_items.split(";");
  var items = new Array(a.length - 1);
  for (var i = 0; i < a.length - 1; i++) {
    items[i] = {
      item_id: a[i].split(":")[0],
      tier: a[i].split(":")[0][1],
      enchantment: a[i].split(":")[1],
      name: a[i].split(":")[2]
    };
  }
  return items;
}

// somewhere from stackoverflow. used to calculate the age from a 3rd party
function getTime(url) {
  return new Promise((resolve, reject) => {
    const req = new XMLHttpRequest();
    req.open("GET", url);
    req.onload = () =>
      req.status === 200 ?
      resolve(req.response) :
      reject(Error(req.statusText));
    req.onerror = (e) => reject(Error(`Network Error: ${e}`));
    req.send();
  });
}

// Main function (Called when "Get Prices" button is pressed)
function getPrices() {
  clearTable('table');
  hideMessage();
  server = document.getElementById("server").value;
  tier = document.getElementById("tier").value;
  enchantment = document.getElementById("enchantment").value;
  quality = document.getElementById("quality").value;
  maxAgeBM = document.getElementById("maxAgeBM").value;
  maxAgeCity = document.getElementById("maxAgeCity").value;
  minProfit = document.getElementById("minProfit").value;

  var city = [];
  var checkboxes = document.getElementById("cities").getElementsByTagName("input");
  for (var i = 0; i < checkboxes.length; i++) {
    if (checkboxes[i].checked)
      city.push(checkboxes[i].value);
  }


  var tierStart = parseInt(tier);
  var tierEnd = parseInt(tier);
  var enchantmentStart = parseInt(enchantment);
  var enchantmentEnd = parseInt(enchantment);

  if (tier == -1) {
    tierStart = 4;
    tierEnd = 8;
  }
  if (enchantment == -1) {
    enchantmentStart = 0;
    enchantmentEnd = 3;
  }

  resetProgress(); //Reset progress total and progressbar
  totalFetches = (tierEnd - tierStart + 1) * (enchantmentEnd - enchantmentStart + 1);
  var count = 0;
  for (var i = tierStart; i < tierEnd + 1; i++) {
    for (var j = enchantmentStart; j < enchantmentEnd + 1; j++) {
      var selected_items;
      selected_items = getItems(i, j);

      fetchData(server, "Prices", city, selected_items, quality, function () {
        printToConsole("API data received!\n");
        // Begin accessing JSON data here
        var data = JSON.parse(this.response);
        //console.log('API object response: ');
        //console.log(data);

        br();
        var cities = splitDataByCity(data);
        if (!calculateAge(cities))
          return;
        if (!calculateProfits(cities))
          return;
        if (!filterDataByParameters(cities))
          return;

        var item;
        for (var i = 1; i < cities.length; i++) {
          for (var j = 0; j < cities[i].length; j++) {
            item = cities[i][j];
            addItemProperties(item);

            if (item.BM_order_difference > 0 && item.BM_order_difference_age > maxAgeCity) {
              item.BM_order_difference = formatMoney(item.BM_order_difference) + " (Outdated)";
            } else if (item.BM_order_difference > 0) {
              item.BM_order_difference = formatMoney(item.BM_order_difference);
            } else {
              item.BM_order_difference = "Outdated";
            }
            addToTable("table",
              (item.tier + "." + item.enchantment),
              item.name,
              formatMoney(item.profit),
              item.percentileProfit,
              formatMoney(item.highestProfitBM_Price),
              qualityToString(item.highestProfitBM_Quality),
              item.highestProfitBM_Age,
              item.BM_order_difference,
              item.BM_order_difference_age > maxAgeCity * 10 ? "Very Old" : item.BM_order_difference_age,
              formatMoney(item.cityPrice),
              qualityToString(item.quality),
              item.city_age,
              item.city,
              item.caerleonProfit < 1 ? "-" : profitableInCaerleon(item, maxAgeCity),
              item.caerleonProfit < 1 ? "-" : qualityToString(item.caerleonQuality),
              item.caerleonProfit < 1 ? "-" : item.caerleonAge // can either be unprofitable or too old, so better leave it as "-" because it doesn't matter
            );
          }      
        }
      });
    }
  }
}

function showMessage(message) {
  var container = document.getElementById('messageContainer');
  var text = document.getElementById('messageText');
  text.textContent = message; // Set the message text
  container.style.display = 'block'; // Show the message
}

function hideMessage() {
  var container = document.getElementById('messageContainer');
  container.style.display = 'none'; // Hide the message
}

function addProgress(progress) {
  totalProgress += progress;
  var overallProgress = (totalProgress / totalFetches);
  document.getElementById("progress").style.width = Math.round(overallProgress * 100) + "%";
  document.getElementById("progress").attributes[3] = Math.round(overallProgress * 100);
  document.getElementById("progress-text").innerText = Math.round(overallProgress * 100) + " %";
  if (Math.round(overallProgress * 100) / 100 == 1) //it can be a little bit over and under cause of calculation errors
    document.getElementById("progress").attributes.class.value = "progress-bar"; //Turn off active
  //console.log(totalProgress);
  //console.log(overallProgress);
}

function resetProgress() {
  totalProgress = 0;
  document.getElementById("progress-text").innerText = "0 %";
  document.getElementById("progress").style.width = "0%";
  document.getElementById("progress").attributes[3] = 0;
  document.getElementById("progress").attributes.class.value = "progress-bar progress-bar-striped active";
}

function formatMoney(amount, decimalCount = 0, decimal = ".", thousands = " ") {
  // it just works
  // https://stackoverflow.com/questions/149055/how-to-format-numbers-as-currency-string
  try {
    decimalCount = Math.abs(decimalCount);
    decimalCount = isNaN(decimalCount) ? 2 : decimalCount;

    const negativeSign = amount < 0 ? "-" : "";

    let i = parseInt(amount = Math.abs(Number(amount) || 0).toFixed(decimalCount)).toString();
    let j = (i.length > 3) ? i.length % 3 : 0;

    return negativeSign + (j ? i.substr(0, j) + thousands : '') + i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + thousands) + (decimalCount ? decimal + Math.abs(amount - i).toFixed(decimalCount).slice(2) : "");
  } catch (e) {
    //console.log(e)
  }
}


function addItemProperties(item) {
  // searches through the items array to find and add properties to the item (name, enchantment, tier)
  for (var i = 0; i < items.length; i++) {
    if (item.item_id == getId(items[i])) {
      item.tier = items[i].tier;
      item.name = items[i].name;
      item.enchantment = items[i].enchantment;
    }
  }
  return true;
}

// Returns the item id's in a string array
function getItems(tier, enchantment) {
  var selected_items = [];
  for (var i = 0; i < items.length; i++) {
    // the user chosen items are pulled from the
    // raw_items and stored in pulled_items
    if (items[i].tier == tier && items[i].enchantment == enchantment) {
      selected_items.push(getId(items[i]));
    }
  }
  return selected_items;
}

// Returns the representing string to the numerical quality number
function qualityToString(num) {
  var names = ["Normal", "Good", "Outstanding", "Excellent", "Masterpiece"];
  return names[num - 1];
}

// Parses through and splits the data array into 7 city arrays and returns it (returns one array containign 7 arrays)
function splitDataByCity(data) {
  printToConsole("Splitting data to cities\n");
  var blackMarket = [];
  var fortSterling = [];
  var thetford = [];
  var lymhurst = [];
  var bridgewatch = [];
  var martlock = [];
  var caerleon = [];

  for (var i = 0; i < data.length; i++) {
    switch (data[i].city) {
      case "Black Market":
        blackMarket.push(data[i]);
        break;
      case "Fort Sterling":
        fortSterling.push(data[i]);
        break;
      case "Thetford":
        thetford.push(data[i]);
        break;
      case "Lymhurst":
        lymhurst.push(data[i]);
        break;
      case "Bridgewatch":
        bridgewatch.push(data[i]);
        break;
      case "Martlock":
        martlock.push(data[i]);
        break;
      case "Caerleon":
        caerleon.push(data[i]);
        break;
    }
  }

  return [blackMarket, fortSterling, thetford, lymhurst, bridgewatch, martlock, caerleon];
}

function profitableInCaerleon(item, maxAgeCity) {
  // checks if there is profit to be made of the item in Caerleon
  if (item.caerleonAge == undefined) {
    return "Caerleon not selected.";
  }

  if (item.caerleonAge <= maxAgeCity) {
    return item.caerleonProfit > 0 ? formatMoney(item.caerleonProfit) : "No";
  } else {
    return item.caerleonProfit > 0 ? formatMoney(item.caerleonProfit) + " (outdated)" : "No (outdated)";
  }
}

/*
  OBS: HAS TO HAPPEN BEFORE THE FILTERING
  loops through all the cities and adds profit properties to every item object in every city.
  the profit calculations also takes into account different qualities since you can sell higher qualities to lower qualities buy orders in BM
*/
function calculateProfits(cities) {
  printToConsole("Calculating profits...\n");
  var item;
  // starts from the last city (6: Caerleon) so the profit properites for Caerleon are calculated before looping
  // through the other cities in descending order. does not loop through i=0 because BM is the first index (0)
  for (var i = cities.length - 1; i > 0; i--) { // loops through all the cities starting with fortSterling
    for (var j = 0; j < cities[i].length; j++) { // loops throught all the items in a city
      /*
        i: city [BM, FS, Th, Ly, Br, Ma, Ca]
        j: item
      */
      item = cities[i][j];

      compareQualities(cities, i, j, ignore_maxAgeCity = false);
      if (item.city == "Caerleon") // for later Caerleon properties comparison
        compareQualities(cities, i, j, ignore_maxAgeCity = true);

      // needs to calculate profit arrays for all qualities before it can find the optimal combination and add the Caerleon properties
      if (item.quality == 5) {
        findOptimalCombination(cities, i, j);
        assignOptimalCombination(cities, i, j);
        addCaerleonProperties(cities, i, j);
      }

    }
  }
  return true;
}


/*
  if the same buy order can be filled by Caerleon the user is warned through the Caerleon properties.
  maxAgeCity for Caerleon properties is increased to ONE_WEEK since the prices don't fluctuate that much.
*/
function addCaerleonProperties(cities, i, j) {
  for (var m = 0; m < cities[i][j].quality; m++) { // loop through every item quality
    cities[i][j - 4 + m].caerleonProfit = NEGATIVE_VALUE_LARGE;
    cities[i][j - 4 + m].caerleonAge = POSITIVE_VALUE_LARGE;
    cities[i][j - 4 + m].caerleonQuality = NEGATIVE_VALUE_LARGE;

    if (cities[i][j - 4 + m].highestProfitBM_Quality == NEGATIVE_VALUE_LARGE) // if the item isn't going to be displayed then it doesn't need to be compared either
      continue;

    for (var n = cities[i][j - 4 + m].highestProfitBM_Quality - 1; n < cities[i][j].quality; n++) { // loop through all the higher qualities
      // if any profit for the same quality as highestProfitBM_Quality is bigger than caerleonProfit, reassign Caerleon properties as that item in Caerleon can be sold to the same buy order
      if (cities[i][j - 4 + m].caerleonProfit < cities[6][j - 4 + n].profits_array_ignored_maxAgeCity[cities[i][j - 4 + m].highestProfitBM_Quality - 1]) {
        cities[i][j - 4 + m].caerleonProfit = cities[6][j - 4 + n].profits_array_ignored_maxAgeCity[cities[i][j - 4 + m].highestProfitBM_Quality - 1];
        cities[i][j - 4 + m].caerleonQuality = cities[6][j - 4 + n].quality;
        cities[i][j - 4 + m].caerleonAge = cities[6][j - 4 + n].city_age;
      }
    }
  }
}


/*
  assigns various new properties based on the result of the optimal_combination property
  cities[i][j] is the masterpiece version of the item
*/
function assignOptimalCombination(cities, i, j) {

  for (var k = 0; k < cities[i][j].optimal_combination.length; k++) {
    var item = cities[i][j - 4 + k];

    // if it is equal to itself's quality then it means that the item is not sold (indices start at 0
    // whereas qualities start at 1, look at "findOptimalCombination()" function for more info)
    if (cities[i][j].optimal_combination[k] == item.quality) {
      item.highestProfitBM_Quality = NEGATIVE_VALUE_LARGE;
      item.highestProfitBM_Price = NEGATIVE_VALUE_LARGE;
      item.highestProfitBM_Age = POSITIVE_VALUE_LARGE;
      item.profit = NEGATIVE_VALUE_LARGE;
      item.BM_order_difference = NEGATIVE_VALUE_LARGE;
      item.BM_order_difference_age = POSITIVE_VALUE_LARGE;
      item.percentileProfit = NEGATIVE_VALUE_LARGE;
    } else {
      item.highestProfitBM_Quality = cities[i][j].optimal_combination[k] + 1; // indices start at 0 but qualities at 1, so need to add 1
      item.highestProfitBM_Price = cities[i][j - 5 + item.highestProfitBM_Quality].bmPrice; // indices start at 0 but qualities at 1, so need to subtract 1
      item.highestProfitBM_Age = cities[i][j - 5 + item.highestProfitBM_Quality].bm_age;
      item.profit = Math.round(item.profits_array[item.highestProfitBM_Quality - 1]);
      item.BM_order_difference = cities[0][j - 5 + item.highestProfitBM_Quality].sell_price_min - cities[0][j - 5 + item.highestProfitBM_Quality].buy_price_max;
      item.BM_order_difference_age = getAge(cities[0][j - 5 + item.highestProfitBM_Quality].sell_price_min_date);
      item.percentileProfit = Math.round(1000 * (item.profit / item.cityPrice)) / 10;
    }

  }

}


/*
  finds the combination of orders that would give the biggest net profit if all the trades are executed
  and sets the optimal_combination property to the optimal combination
  cities[i][j].optimal_combination format:
  [normal, good, outstanding, excellent, masterpiece]
  the number tells to which index to sell to. if highers than itself's index then no trade should be made, eg.:
  optimal_combination = [0, 2, 3, 2, 1]
  optimal_combination[0] == 0: normal-normal
  optimal_combination[1] == 2: good-nothing (2 is higher than itself's index, 1)
  optimal_combination[2] == 3: outstanding-nothing (3 is higher than itself's index, 2)
  optimal_combination[3] == 2: excellent-outstanding
  optimal_combination[4] == 1: masterpiece-good
*/
function findOptimalCombination(cities, i, j) {

  var m_profits = cities[i][j].profits_array;
  var e_profits = cities[i][j - 1].profits_array;
  var o_profits = cities[i][j - 2].profits_array;
  var g_profits = cities[i][j - 3].profits_array;
  var n_profits = cities[i][j - 4].profits_array;

  var biggest_sum = 0;
  var optimal_combination = [0, 0, 0, 0, 0];

  var new_sum;

  for (var m = 0; m < m_profits.length; m++) {

    for (var e = 0; e < e_profits.length; e++) {

      for (var o = 0; o < o_profits.length; o++) {

        for (var g = 0; g < g_profits.length; g++) {

          for (var n = 0; n < n_profits.length; n++) {

            new_sum = m_profits[m] + e_profits[e] + o_profits[o] + g_profits[g] + n_profits[n];

            if (
              (new_sum > biggest_sum) &&
              ((m != e || e == 4) && (m != o || o == 3) && (m != g || g == 2) && (m != n || n == 1)) &&
              ((e != o || o == 3) && (e != g || g == 2) && (e != n || n == 1)) &&
              ((o != g || g == 2) && (o != n || n == 1)) &&
              ((g != n || n == 1))
            ) {
              biggest_sum = new_sum;
              optimal_combination[4] = m;
              optimal_combination[3] = e;
              optimal_combination[2] = o;
              optimal_combination[1] = g;
              optimal_combination[0] = n;
            }

          }

        }

      }

    }

  }

  cities[i][j].optimal_combination = optimal_combination;

}


/*
  puts all the profits for different quality comparisons in the item.profit_array if ignore_maxAgeCity is false.
  if it is true instead puts them in the profits_array_ignored_maxAgeCity array. also logs the number of profitable and fresh trades
  item.profit_array format (assuming masterpiece item quality, cityQ-BMQ):
  [masterpiece-normal, masterpiece-good, masterpiece-outstanding, masterpiece-excellent, masterpiece-masterpiece, 0]
  last index is the profit if the item is not sold. if the trade is unprofitable a 0 will be put in place.
*/
function compareQualities(cities, i, j, ignore_maxAgeCity) {
  var item = cities[i][j];
  item.bmPrice = cities[0][j].buy_price_max;
  item.cityPrice = item.sell_price_min;

  ignore_maxAgeCity ? item.profits_array_ignored_maxAgeCity = [] : item.profits_array = [];

  for (var k = 0; k < item.quality; k++) {
    /*
    Assuming item.quality == 5 (masterpiece):
     k = 0: masterpiece vs masterpiece
     k = 1: masterpiece vs excellent
     k = 2: masterpiece vs outstanding
     k = 3: masterpiece vs good
     k = 4: masterpiece vs normal
    */
    var tax_modifier = document.getElementById("premium").checked ? 0.97 : 0.94;
    var qualityProfit = (cities[0][j - k].buy_price_max * tax_modifier) - item.sell_price_min;

    if (ignore_maxAgeCity) {

      if (qualityProfit > 0 && cities[i][j - k].bm_age <= maxAgeBM && item.city_age <= ONE_WEEK) {
        item.profits_array_ignored_maxAgeCity.splice(0, 0, qualityProfit);
      } else {
        item.profits_array_ignored_maxAgeCity.splice(0, 0, 0);
      }

      if (k == (item.quality - 1)) {
        item.profits_array_ignored_maxAgeCity.push(0);
      }

    } else {

      if (qualityProfit > 0 && cities[i][j - k].bm_age <= maxAgeBM && item.city_age <= maxAgeCity) {
        item.profits_array.splice(0, 0, qualityProfit);
      } else {
        item.profits_array.splice(0, 0, 0); // adds a zero if the quality comparison is outdated or not profitable
      }

      if (k == (item.quality - 1)) {
        item.profits_array.push(0); // adds an extra zero to get all possible combinations later
      }

      if (qualityProfit >= minProfit && !ignore_maxAgeCity)
        profitableTrades++;
      if (cities[i][j - k].bm_age <= maxAgeBM && item.city_age <= maxAgeCity && !ignore_maxAgeCity)
        freshTrades++;

    }

  }
}

// OBS! has to happen before filterDataByParameters() relies on BM data and city data being parallel
function calculateAge(cities) {
  printToConsole("Calculating age...\n")
  var item;
  // Start from 1 because blackmarket is in first index
  for (var i = 1; i < cities.length; i++) { // Loop through all the cities starting with fortSterling
    for (var j = 0; j < cities[i].length; j++) { // Loop throught all the items in a city
      item = cities[i][j];
      item.bm_age = getAge(cities[0][j].buy_price_max_date);
      item.city_age = getAge(cities[i][j].sell_price_min_date);
    }
  }
  return true;
}

// cities: must have profit calculated and added into each item of each city
// returns true if items was filitered profitable, false if all items was removed
function filterDataByParameters(cities) {
  // cities[0] is the blackMarket first for loop then starts from 1
  for (var i = 1; i < cities.length; i++) { // Loop through every city
    for (var j = 0; j < cities[i].length; j++) { // Loop through every item
      var item = cities[i][j];

      // the reason for 2 item.profit comparisons even though < minProfit would be enough is because
      // some weird entries can show up if you enter a negative value in Min Profit
      if (item.profit < minProfit || item.profit <= 0 || item.highestProfitBM_Age > maxAgeBM || item.city_age > maxAgeCity) {
        cities[i].splice(j, 1);
        j--;
      }

    }
    totalApprovedTrades += cities[i].length;
  }

  // only true if all the items from all the cities have been spliced
  if (totalApprovedTrades == 0) {
    if (freshTrades == 0) {
      printToConsole("Data too old. Pick bigger max age or update the market via the Data Client.\n");
      showMessage("Data too old. Pick bigger max age or update the market via the Data Client.")
    } else if (profitableTrades == 0) {
      printToConsole("No profitable trades found. Try decreasing Min Profit.\n");
      showMessage("No profitable trades found. Try decreasing Min Profit.");
    } else if (profitableTrades != 0 && freshTrades != 0) {
      printToConsole("No fresh and profitable items found. Adjust one of the parameters and try again.\n")
      showMessage("No fresh and profitable items found. Adjust one of the parameters and try again.")
    }
  } else {
    printToConsole("Profitable and fresh items found!\n");
  }

  return totalApprovedTrades;
}

function printToConsole(text) {
  document.getElementById("console").append(text);
  document.getElementById("console").scrollTop = document.getElementById("console").scrollHeight;
}

function clearConsole() {
  document.getElementById("console").textContent = "";
}

// returns minutes since currentUTCTime and itemAge
function getAge(itemAge) {
  return Math.round((Date.now() - Date.parse(new Date(itemAge.concat('Z')))) / 60000);
}

// Returns the parsed json response from the API
//
// Type: has following different types {Charts, history, Gold, View, Prices} should be a string
// City: array of cities names to fetch from
// Selected_Items: array of items to fetch (max about 300)
// Quality: {0,1,2,3,4,5} if 0 will fetch all qualities 1 = Normal and so on
function fetchData(server, type, cities, selected_items, quality, callback) {
  // Create a request variable and assign a new XMLHttpRequest object to it.

  var url; 
  switch(server){
    case 'europe': 
      url = 'https://europe.albion-online-data.com/';
      break;
    case 'asia': 
      url = "https://east.albion-online-data.com/";
      break;
    case 'americas': 
      url = "https://west.albion-online-data.com/";
      break;
    default: 
      url = 'https://europe.albion-online-data.com/';
  };

  var request = new XMLHttpRequest();

  var view = "api/v2/stats/" + type + "/";
  var locations = [cities.join(","), "Black Market"]
  var link = url + view + selected_items.join(",") + "?locations=" + locations.join(",") + "&qualities=" + quality;
  //console.log("API link is "+link);
  printToConsole("Requesting " + server + " API for " + type + " with " + selected_items.length + " items" + " with quality " + quality + "\n");
  // Open a new connection, using the GET request on the URL endpoint
  request.open('GET', link, true)

  request.onload = callback;
  var old = 0;
  var fresh = 0;
  request.onprogress = function (e) {
    if (e.lengthComputable) {
      old = fresh;
      fresh = e.loaded / e.total;
      addProgress(fresh - old); // add the progress that was made since last check
    }
  }

  // Send request
  request.send();

  printToConsole("Fetching data from API...\n");
}

// Add a row of data to the id table
function addToTable(id, ...cells) {
  //var table = document.getElementById(id).getElementsByTagName('tbody')[0];
  //var row = table.insertRow(0);
  var colColors = ["", "", "", "", "#E5FFCD", "#E5FFCD", "#E5FFCD", "#E7EDEF", "#E7EDEF", "#CDFFF3", "#CDFFF3", "#CDFFF3", "#CDFFF3", "#FFDEF6", "#FFDEF6", "#FFDEF6", ""]
  var append = "<tr>";
  for (var i = 0; i < cells.length; i++) {
    append += '<td style="background-color:' + colColors[i] + '" copy-data="' + cells[i] + '" onClick="copyToClipboard()" data-value="' + replaceAll((cells[i] + ""), " ", "") + '">' + cells[i] + '</td>';
    //var cell = row.insertCell(i);
    //cell.innerHTML = cells[i];
  }
  if (id == "table") {
    append += `
      <td>
        <button type="button" onClick="addToCart(\'cart\', this)" class="btn btn-default btn-sm">
         <i class="fas fa-plus-circle"></i>
        </button>
      </td>
      `;
  }
  append += "</tr>";
  $('#table').append(append);
}

// Add the table row to the shop table of the id
// without the button that was pressed to add it (no add button in the shopping cart)
function addToCart(id, element) {
  element.disabled = true; // Diable the add button that was pressed (<button>)
  $('#cart tr:last').remove(); // Remove last row with the totals in the cart.
  //console.log(element);
  var table_row = element.parentElement.parentElement; // The row (<tr>) of the pressed button
  var tr = element.parentElement;
  table_row.removeChild(tr); // Remove button so it is not in the clone
  var clone = table_row.cloneNode(true);
  table_row.appendChild(tr);
  //table_row.removeChild(element) // Remove the <td> where the button is from the row
  //console.log(clone);
  $('#cart').append(clone.outerHTML); // Add item to table

  var rows = $("#cart tr");
  var profit = 0;
  var bm_buy_price = 0;
  var bm_age_avg = 0;
  var bm_order_avg = 0;
  var city_sell = 0;
  var city_age_avg = 0;
  var caerleon_profit = 0;
  var caerleon_age_avg = 0;

  // Sum and calc interesting vars up
  for (var i = 1; i < rows.length; i++) { // Start at one (skip table head)
    var row = rows[i];
    profit += parseFloat(row.cells[2].attributes["data-value"].value);
    bm_buy_price += parseFloat(row.cells[4].attributes["data-value"].value);
    bm_age_avg += parseFloat(row.cells[6].attributes["data-value"].value) / (rows.length - 1);

    if (!isNaN(row.cells[7].attributes["data-value"].value))
      bm_order_avg += parseFloat(row.cells[7].attributes["data-value"].value) / (rows.length - 1);

    if (!isNaN(row.cells[9].attributes["data-value"].value))
      city_sell += parseFloat(row.cells[9].attributes["data-value"].value);

    city_age_avg += parseFloat(row.cells[11].attributes["data-value"].value) / (rows.length - 1);

    if (!isNaN(parseFloat(row.cells[13].attributes["data-value"].value.replace(/[^0-9]/g, ''))))
      caerleon_profit += parseFloat(row.cells[13].attributes["data-value"].value.replace(/[^0-9]/g, ''));

    if (!isNaN(row.cells[15].attributes["data-value"].value))
      caerleon_age_avg += parseFloat(row.cells[15].attributes["data-value"].value) / (rows.length - 1);
  }
  $('#cart').append(
    `<tr>
      <td>Total</td>
      <td></td>
      <td data-toggle="tooltip" data-placement="bottom" title="Total profit">` + formatMoney(profit) + `</td>
      <td data-toggle="tooltip" data-placement="bottom" title="Total % of the profit (profit/cost)">` + Math.round(1000 * (profit / city_sell)) / 10 + `</td>
      <td data-toggle="tooltip" data-placement="bottom" title="Items should be sold for this total in the Black Market">` + formatMoney(bm_buy_price) + `</td>
      <td></td>
      <td data-toggle="tooltip" data-placement="bottom" title="Average of the Black Market">` + Math.round(bm_age_avg) + `</td>
      <td>` + `</td>
      <td></td>
      <td data-toggle="tooltip" data-placement="bottom" title="This is the total cost of the cart">` + formatMoney(city_sell) + `</td>
      <td></td>
      <td data-toggle="tooltip" data-placement="bottom" title="Average city age">` + Math.round(city_age_avg) + `</td>
      <td></td>
      <td data-toggle="tooltip" data-placement="bottom" title="Total potential Caerleon profit (might be outdated)">` + formatMoney(caerleon_profit) + `</td>
      <td></td>
      <td>` + `</td>
    </tr>`
  );
}

function clearTable(id) {
  var table = document.getElementById(id);
  var new_body = document.createElement('tbody'); // Empty body
  var body = table.getElementsByTagName("tbody")[0]; // First body
  table.replaceChild(new_body, body);
  if (id == "cart")
    $('#cart').append("<tr></tr>");
}

function replaceAll(str, needle, replace) {
  while (str != str.replace(needle, replace)) {
    str = str.replace(needle, replace)
  }
  return str
}

// Appends a new row to the body
function br() {
  document.getElementById('console').append(document.createElement("br"));
}

// Returns the id of a item object. matching the raw items data
function getId(item) {
  // gets the id of an item
  return item.enchantment == 0 ? item.item_id : item.item_id + "@" + item.enchantment;
}

// Sets the copy for the user to the copy-data of the element when clicked
function copyToClipboard() {
  const el = document.createElement('textarea');
  el.value = event.target.getAttribute('copy-data');
  el.setAttribute('readonly', '');
  el.style.position = 'absolute';
  el.style.left = '-9999px';
  document.body.appendChild(el);
  el.select();
  document.execCommand('copy');
  document.body.removeChild(el);
}