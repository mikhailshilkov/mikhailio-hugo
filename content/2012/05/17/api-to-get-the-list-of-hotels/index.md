---
title: API to get the list of hotels
date: 2012-05-17
tags: ["API","Python"]
description: In our travelling application, we need to show the list of hotels in a city (St. Petersburg, Russia at the moment, but more will be needed in the future). The idea was to find a hotel information provider, and then upload the complete list into our own database.
---

In our travelling application, we need to show the list of hotels in a city (St. Petersburg, Russia at the moment, but more will be needed in the future). The idea was to find a hotel information provider, and then upload the complete list into our own database. The following info is needed for each hotel:

*   Name in English
*   Location (latitude / longitude)
*   An image would be nice
*   Probably, some sort of rating
We started with [Booking.com](http://www.booking.com/index.html?aid=352212 "Booking.com"), which does have API, but the API is NOT public, and one has to provide website/bank account information to become an affiliate and get the access.

Then, I had a try with [GeoNames.org](http://GeoNames.org "GeoNames.org"), which I once used for the list of populated localities in Europe. Unfortunately, the POI list in Russia is quite poor there.

We had next try with [OpenStreetMap](http://www.openstreetmap.org "OpenStreetMap") data. I've downloaded a 7 GB XML file with POIs of Russia. But I got disappointed once again after parsing it: only about 100 hotels in St. Petersburg + most names are in Russian.

Finally, we've found the solution. [HotelsCombined](http://www.hotelscombined.com/?a_aid=61901 "HotelsCombined") has an easy-to-access and useful service to download the data feed files with hotels. 590 hotels in St. Petersburg - good enough! Here is how you get it:

1.  Go to [http://www.hotelscombined.com/Affiliates.aspx](http://www.hotelscombined.com/Affiliates.aspx)
2.  Register there (no company or bank data is needed)
3.  Open "Data feeds" page
4.  Choose "Standard data feed" -> "Single file" -> "CSV format" (you may get XML as well)

Parsing the CSV file is a piece of cake, here is a sample Python code to filter out hotels from St. Petersburg:

    def filter_hotels(from_file):
        with open(from_file, 'r') as fr:
            while True:
                line = fr.readline()
                if len(line) == 0:
                    break # EOF
                hotel = line.split(',')
                city_code = hotel[5]
                country_code = hotel[10]
                if city_code == 'St_Petersburg' and country_code == 'RU':
                    hotel_name = hotel[2]
                    print hotel_name

Here is the complete list of fields in CSV/XML:

    hotelId, hotelFileName, hotelName, rating, cityId, cityFileName, cityName, stateId, stateFileName, stateName, countryCode, countryFileName, countryName, imageId, address, minRate, currencyCode, Latitude, Longitude, NumberOfReviews, ConsumerRating, PropertyType, ChainID, Facilities

**Update:** Unfortunately, HotelsCombined.com has introduced the new regulations: they've restricted the access to data feeds by default. To get the access, a partner must submit some information on why one needs the data. The HC team will review it and then (maybe) will grant access. Sad but true. I'm in the middle of getting through this guarg, I'll let you know about the result.

**Update 2:** Yes, we got the access to data feeds again. After reviewing the application form, HotelsCombined asked us to let them know our IP, white-listed it and now we can download the files. Still, I don't know why they need all this procedure at all.