async function fetchData(url) {
    //console.log(url);
    try {
        const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
    }
    return await response.json();
    } catch (error) {
        console.error('Error fetching JSON:', error);
    }
}

async function extractItems() {
    let items = [];
    apiData = await fetchData('https://vekeng.github.io/AlbionFlipper/json/items.json');  // Wait for fetchData to complete
    apiData.forEach(item => {
        let itemTier, itemName, itemDescriptionEng;
        const [, itemEnchantment] = item.UniqueName.includes('@') ? item.UniqueName.split('@') : [item.UniqueName, 0];
        const itemID = item.UniqueName;
        const match = itemID.match(/^T(\d)/);
        if (match) {
            itemTier = parseInt(match[1]);
        } else {
            itemTier = 0;
        }
        if (item.LocalizedNames) {
            itemName = item.LocalizedNames['EN-US'];
        } else {
            itemName = "N/A"
        }
        if (item.LocalizedDescriptions) {
            itemDescriptionEng = item.LocalizedDescriptions['EN-US']; 
        } else { itemDescriptionEng = 'non-trad'; }
        if (itemTier && itemTier >= 4 && !itemDescriptionEng.includes("non-trad")) {
            items.push({ID: itemID, name: itemName, enchantment: itemEnchantment, tier: itemTier});
        }
    });
    return items;
}

async function getMarketData(region,cities,items) {
    let server;
    switch(region) {
        case 'europe': 
            server = 'https://europe.albion-online-data.com';
            break;
        case 'asia': 
            server = "https://east.albion-online-data.com";
            break;
        case 'americas': 
            server = "https://west.albion-online-data.com";
            break;
        default: 
            server = 'https://europe.albion-online-data.com';
    };
    const citiesString = cities.join(',');
    url = `${server}/api/v2/stats/Prices/${items}.json?locations=${cities}&qualities=0,1,2,3,4`
    return await fetchData(url);
}

async function main(server, tier, cities, marketAge, premium) {
    let taxModifier; 
    if (!premium) {
        taxModifier = 0.92;
    } else { taxModifier = 0.96;  }
    const items = await extractItems();
    const selectedItems = items
        .filter(item => tier.includes(item.tier))
        .map(item => item.ID);
    const chunkSize = 250; 
    const itemChunks = splitArrayIntoChunks(selectedItems, chunkSize);
    const allItems = [];
    const totalChunks = itemChunks.length;
    let completedChunks = 0; 
    for (const chunk of itemChunks) {
        const data = await getMarketData(server,cities,chunk);
        if (data) {
            allItems.push(...data);  // Merge the fetched data
        }
        completedChunks++;
        const progress = (completedChunks / totalChunks) * 100;
        document.getElementById("progressBar").style.width = `${progress}%`;
        document.getElementById("progressBar").setAttribute('aria-valuenow', progress);  
    }
    const profitableTrades = findProfitableTradesBetweenCities(allItems, cities, taxModifier, marketAge);
    const topProfitableTrades  = new Map();
    profitableTrades.forEach(trade => {
        const itemId = trade.itemId; 
        const profit = trade.profit;
        if (!topProfitableTrades.has(itemId) || profit > topProfitableTrades.get(itemId).profit) {
            // Update with the new trade if it has a higher profit
            topProfitableTrades.set(itemId, trade);
          }
    });
    const topProfitableTradesWithNames = fillNames(items,topProfitableTrades)
    populateTradesTable(topProfitableTradesWithNames);
}
/*
function populateTradesTable(trades) {
    console.log(Array.from(trades.values()));
    $('#tradesTable').bootstrapTable('refreshOptions', {
        
        data: Array.from(trades.values()), // Pass the array of trades data
        sortable: true
    });
}
*/
function populateTradesTable(trades) {
    $('#tradesTable').bootstrapTable('refreshOptions', {
        data: Array.from(trades.values()), // Pass the array of trades data
        sortable: true,
        sortOrder: 'desc', // Default sort order is descending
        sortName: 'profit', // Default column to sort by
        columns: [
            { field: 'item', visible: true, formatter: formatItems},
            //{ field: 'itemTier', sortable: true, visible: true },
            //{ field: 'itemName', sortable: true, visible: true },
            { field: 'profit', sortable: true, visible: true },
            { field: 'risk', sortable: false, visible: true, formatter: buySellDiff},
            { field: 'tradeRoute', sortable: true, visible: true, formatter: tradeRouteFormatter }
        ]
    });
	applyProfitFilter();
}

function buySellDiff(value, row) {
    if (row.risk > 0.90 ) { 
        risk = `<div title="Order may get fulfilled soon!">${row.risk} ⚠️</div>`;
    } else if (row.risk === "N/A" ) {
        risk = `<div title="Data is missing to calculate risk">${row.risk}</div>`;
    } else { risk = row.risk }
    return risk;
}

function formatItems(value, row) { 
    return `
    <img src="https://render.albiononline.com/v1/item/${row.itemId}.png" alt="Item Image" width="50" height="50">
    ${row.itemName}
    ${row.itemTier}
    `;
}

function tradeRouteFormatter(value, row) {
    return `
        <div class="trade-route-container">
            <div class="trade-block">
                <strong>City:</strong> ${row.buyFromCity}<br>
                <strong>Price:</strong> ${row.sellOrder}<br>
                <strong>Quality:</strong> ${row.sellQuality}
                <div class="age-text">Age: ${row.sellAge}</div>
            </div>
            <span class="arrow">→</span>
            <div class="trade-block">
                <strong>City:</strong> ${row.sellToCity}<br>
                <strong>Price:</strong> ${row.buyOrder}<br>
                <strong>Quality:</strong> ${row.buyQuality}
                <div class="age-text">Age: ${row.buyAge}</div>
            </div>
        </div>
    `;
}

function fillNames (items, trades) {
    const itemLookup = new Map();
    items.forEach(item => {
        itemLookup.set(item.ID, {
            itemName: item.name, 
            itemTier: item.tier,
            itemEnchantment: item.enchantment,
        });
    });

// Iterate over json1 and add itemName from the lookup map
    trades.forEach(item => {
        const itemData = itemLookup.get(item.itemId);
        if (itemData) {
            item.itemName = itemData.itemName;
            item.itemTier = `${itemData.itemTier}.${itemData.itemEnchantment}`;
        }
    });
    return trades; 
}

function splitArrayIntoChunks(array, chunkSize) {
    const chunks = [];
    for (let i = 0; i < array.length; i += chunkSize) {
        chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
}


function findProfitableTradesBetweenCities(data, cities, taxModifier, marketAge) {
    const profitableTrades = [];
    const now = new Date();

    // Group items by item_id for easier lookup  
    const itemsById = data.reduce((acc, item) => {
        if (!acc[item.item_id]) acc[item.item_id] = [];
        acc[item.item_id].push(item);
        return acc;
    }, {});
  
    // Iterate over each item type
    for (const item_id in itemsById) {
        const items = itemsById[item_id];

        // Compare listings within the defined cities only
        for (let i = 0; i < items.length; i++) {
            const itemA = items[i];

            // Skip if the item is not in one of the desired cities
            if (!cities.includes(itemA.city)) continue;

            // Convert sell price date to Date object and check if it's within market age
            const sellDate = new Date(`${itemA.sell_price_min_date}Z`);
            const sellAge = parseInt((now - sellDate) / 60 / 1000);
            if (sellAge > marketAge) continue;

            for (let j = 0; j < items.length; j++) {
                if (i === j) continue; // Avoid comparing the same city with itself

                const itemB = items[j];
                if (itemB.city != "Black Market") continue;

                // Skip if the item is not in one of the desired cities
                if (!cities.includes(itemB.city)) continue;

                // Convert buy price date to Date object and check if it's within market age
                const buyDate = new Date(`${itemB.buy_price_max_date}Z`);
                const buyAge = parseInt((now - buyDate) / 60 / 1000); 
                if (buyAge > marketAge) continue;

                // Extract relevant values for comparison
                const {
                    sell_price_min: sellPriceA,
                    city: cityA,
                    quality: qualityA
                } = itemA;
                const {
                    buy_price_max: rawBuyPriceB,
                    sell_price_min: minBuyOrder,
                    city: cityB,
                    quality: qualityB
                } = itemB;

                risk = (rawBuyPriceB * 100 / minBuyOrder)/100; 
                //console.log(risk, typeof(risk));
                if (risk === Infinity || risk > 1 ) { risk = "N/A" } else { risk = risk.toFixed(2)}

                const buyPriceB = parseInt(rawBuyPriceB * taxModifier);
                // Check for profitable trade, ensuring quality constraints are met
                if (buyPriceB > sellPriceA && sellPriceA > 0 && cityA != cityB && qualityA >= qualityB) {
                    profitableTrades.push({
                        buyFromCity: cityA,
                        sellToCity: cityB,
                        itemId: item_id,
                        sellOrder: sellPriceA,
                        buyOrder: rawBuyPriceB,
                        sellQuality: mapQuality(qualityA),
                        buyQuality: mapQuality(qualityB),
                        sellAge: sellAge,
                        buyAge: buyAge,
                        profit: buyPriceB - sellPriceA,
                        risk: risk, 
                    });
                }
            }
        }
    }

    return profitableTrades;
}

function mapQuality(quality) {
    switch(quality) {
        case 1: 
            return "Normal";
        case 2: 
            return "Good";
        case 3: 
            return "Outstanding";
        case 4: 
            return "Excellent";
        case 5: 
            return "Masterpiece"
        default: 
            return "Normal"
    };
}
//main()