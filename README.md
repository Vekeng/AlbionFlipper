# Flipper - Quick Overview
AlbionFlipper is a Black Market flipping tool for the sandbox MMORPG Albion Online.

AlbionFlipper uses data collected by [The Albion Online Data Project](https://www.albion-online-data.com/) to compare prices of buy orders in the [Black Market](https://wiki.albiononline.com/wiki/Black_Market) in Caerleon with sell orders in the markets of royal cities and Caerleon. 

To start using AlbionFlipper, [click here](https://vekeng.github.io/AlbionFlipper/)

An example of some trades retrieved by AlbionFlipper:

![alt text](img/main.png)

As you can see in the image above, the 6.4 Master's Infernal Staff can be sold for a profit of 1 956 402 silver if bought in Bridgewatch and sold to the BM.

Feel free to join our discord [here](https://discord.gg/2ySkAuX).
<br/><br/>

## Full User Tutorial
For the best possible results, it is strongly suggested to use the Albion Data Client together with this tool. The API has no way of telling when an item has been sold, so it is therefore best to assume that if **Age** are high, the buy order has already been filled.

As the best results are achieved by using the Albion Data Client, this tutorial will explain how to use AlbionFlipper together with the Albion Data Client. Start by downloading the data client from: [www.albion-online-data.com](https://www.albion-online-data.com/)

  1. Make sure the Albion Data Client is running in the background:
  
![alt text](https://github.com/klutten99/Flipper/blob/master/images/1.png)

  2. Login to Albion Online and update the location of your character by switching locations (e.g. go out of the bank and then back into the bank). Example of how the Data Client should respond:
  
![alt text](https://github.com/klutten99/Flipper/blob/master/images/2.png)

  3. Go to whatever market you want to flip from and select the **Category**, **Tier**, **Enchantment** and **Quality** of the items you want to flip. An efficient way of updating many items is to, for example, choose **Tier 8** and category: **Accessories**.

![alt text](https://github.com/klutten99/Flipper/blob/master/images/3.png)

  4. Keep pressing the next page arrow (marked with a red box in the image below) until you either hit page 20 or there are no more pages with items left. In the image below we hit the maximum page 20 meaning that there are still more items we can update.
  
![alt text](https://github.com/klutten99/Flipper/blob/master/images/4.png) 
 
  5. Click the **Price** column (marked with a red box in the image below) to sort the items in the opposite order (if previously they were sorted in ascending order, now they will be sorted in descending order). In our example the items are now in descending order (by price), meaning that they get cheaper as we go.
  
![alt text](https://github.com/klutten99/Flipper/blob/master/images/5.png) 
  
  6. Repeat **Step 4**. Here you can stop once you reach the same prices as on the last page 20 in **Step 4**. In the image below we can see that the prices on page 10 are descending from 1 289 999. This means that the range of prices we updated is 79 995 – 1 332 999 (price of the first and last item in **Step 3** and **4** respectively) and 30 000 000 – 1 279 998 (price of the first and last item in **Step 5** and **6** respectively). In other words, we have updated all the **Tier 8 Accessories** in the **Fort Sterling** market. Now repeat **steps 3 – 6** for **Armor**, **Magic**, **Melee**, **Off-Hand**, **Ranged** and **Tool** categories.

![alt text](https://github.com/klutten99/Flipper/blob/master/images/6.png) 
   
While you are updating the items make sure the Albion Data Client is sending the updates (see the image below for how it looks when the items are being updated). If you are getting errors, try updating your location (leave and enter the market for example).

![alt text](https://github.com/klutten99/Flipper/blob/master/images/6_2.png) 

  7. Fast travel to the **Black Market** and update the same items as you did in the previous market (repeat **steps 3 – 6**). **Hint: have one of your characters be in the Black Market so you can quickly switch characters and update the Black Market without fast travel!**

  8. Choose the appropriate parameters in Flipper and click the “Find Flips!” button. Make sure the **Age** is as low as possible. The API has no way of knowing when an item has been sold, so if you choose a too large **Age** there is a chance the buy order has already been filled. 

![alt text](img/settings.png)

  9. You should see items that you can flip. 

![alt text](img/results.png)

### Some Last Words and Tips
This is merely a suggestion on how to get started with Flipper. Updating items in this manner will usually not work for lower tiers that have a lot more items for sale than tier 8. In that case you will for example have to update each quality or enchantment one by one. If you know which items are usually profitable then you can only update these.

If you wish to only flip items between the Caerleon market and the Black Market, then you can uncheck all the other cities. Caerleon is always checked as the program uses the Caerleon item data to warn users flipping from other cities if the same buy order can be filled by the Caerleon market. This causes Caerleon trades to also appear in the table, so sort first by profit and then by city if you only want to flip from another city and ignore Caerleon.

The reason why quality is set to all and cannot be changed is because the program compares the different combinations of trades and qualities that can be made and displays the trades that would give the highest net profit if all the trades for the same item were executed.

The key in market flipping is speed. The item data that you are sending is public and other people using Flipper will also see the same trades as you. You need to therefore be fast in updating the items and then executing the trades. If you don’t make a trade in time you can usually recover most of the money by putting it up for sale on one of the markets or on the Black Market, albeit it will take time to sell.

On that note, we wish you good luck and happy flipping!








