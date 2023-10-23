const puppeteer = require("puppeteer");

const scraping = async () => {
    try {
        let i = 0;
        const browser = await puppeteer.launch({
            executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
          headless: false
        })
        const page = await browser.newPage();

        page.setDefaultNavigationTimeout(0);

        await page.goto('https://www.acquizition.biz/en/signin', {
            waitUntil: 'networkidle0',
        });

        console.log('111');

        // Login
        await page.type('[id=username]', 'yaroslav.v@openfairmarket.com');
        await page.type('[id=password]', 'Openfair2022!');
        await page.click('.jMQoLp button[type=submit]');
        await page.waitForNavigation({
            waitUntil: 'load',
        });
        // Login end

        console.log('222');

        await page.goto('https://www.acquizition.biz/en/businessesForSale', {
            waitUntil: 'networkidle0',
        });

        console.log('333');

        let nChildrenCount = await page.evaluate('document.getElementsByClassName("sc-uhnfH fBlJZZ")[0].children.length');
        while (true) {
            console.log(nChildrenCount);
            await page.evaluate('document.getElementsByClassName("sc-uhnfH fBlJZZ")[0].scrollIntoView(false)');
            await page.waitForTimeout(100);
            await page.waitForSelector('.sc-bhNKFk.jPTCEF');
            let newCount = await page.evaluate('document.getElementsByClassName("sc-uhnfH fBlJZZ")[0].children.length');
            if (newCount === nChildrenCount) {
                break;
            }
            nChildrenCount = newCount;
        }

        console.log('444');

        const arrayListingIds = [];

        const divListings = await page.$$('div[id^="6"]');
        console.log(divListings);
        console.log(divListings.length);
        for (i = 0; i < divListings.length; i++) {
            const strListingId = await page.evaluate(el => el.id, divListings[i]);
            arrayListingIds.push(strListingId);
        }

        console.log('555');

        let result = [];

        const baseUrl = 'https://www.acquizition.biz/en/fl/';
        for (i = 0; i < arrayListingIds.length; i++) {
            const listUrl = `${baseUrl}${arrayListingIds[i]}`;
            console.log(i, ', ', listUrl);
            await page.goto(listUrl, {
                waitUntil: 'load',
            });
            await page.waitForSelector('.sc-kmXbIF.liuvie');

            // Page evaluate
            const data = await page.evaluate(async () => {
                let k;
                const capitalizeFirstLetter = (string) => string.charAt(0).toUpperCase() + string.slice(1);

                const getVal = (val) => {
                    const multiplier = val.substr(-1).toLowerCase();
                    if (multiplier == "k") return parseFloat(val) * 1000;
                    else if (multiplier == "m") return parseFloat(val) * 1000000;
                    else return parseFloat(val);
                };

                const getCityAndProvince = (strRegion) => {
                    let city = '';
                    let province_id = '';
                    let province_name = '';

                    if (strRegion.length === 0) {
                        return {
                            'city': city,
                            'province_id': province_id,
                            'province_name': province_name,
                        }
                    }

                    let strProvince = '';
                    const tokens = strRegion.split(',');
                    if (tokens.length == 1) {
                        strProvince = tokens[0].trim();
                    } else {
                        strProvince = tokens[0].trim();
                        city = tokens[1].trim();
                    }

                    strProvince = strProvince.toLowerCase();

                    return {
                        'city': city.length == 0 ? '' : capitalizeFirstLetter(city),
                        'province_id': province_id,
                        'province_name': province_name,
                    }
                };

                let _business_name = document.querySelector('.sc-kmXbIF.liuvie h3').innerText;
                _business_name = _business_name.trim();

                let _country = 'Canada';
                let cityAndProvince = {
                    'city': '',
                    'province_id': '',
                    'province_name': '',
                };
                let _foundedYear = 0;
                let _industries = [], _sectors = [];
                let _numberOfEmployees = 0;
                let _price = 0;
                let _profit = 0;
                let _revenue = 0;
                const elements1 = document.querySelectorAll('.sc-iuxOeI.eRathl');
                for (k = 0; k < elements1.length; k++) {
                    const sectionTitle = elements1[k].innerText;
                    if (sectionTitle.includes('Location (primary)')) {
                        const _region = elements1[k].nextSibling.innerText;
                        cityAndProvince = getCityAndProvince(_region.trim());
                    } else if (sectionTitle.includes('Founded')) {
                        _foundedYear = elements1[k].nextSibling.innerText;
                        _foundedYear = _foundedYear.trim();
                        _foundedYear = _foundedYear == '' ? 0 : Number(_foundedYear);
                    } else if (sectionTitle.includes('Business sector')) {
                        const _sector = elements1[k].nextSibling.innerText;
                        _sectors.push(_sector.trim());
                    } else if (sectionTitle.includes('Employees')) {
                        _numberOfEmployees = elements1[k].nextSibling.innerText;
                        _numberOfEmployees = _numberOfEmployees.trim();
                        _numberOfEmployees = _numberOfEmployees == '' ? 0 : Number(_numberOfEmployees);
                    } else if (sectionTitle.includes('Asking price')) {
                        _price = elements1[k].nextSibling.innerText;
                        _price = _price.replaceAll(String.fromCharCode(160), '').trim();
                        _price = _price == '' ? 0 : Number(_price);
                    } else if (sectionTitle.includes('EBITDA')) {
                        _profit = elements1[k].nextSibling.innerText;
                        _profit = _profit.trim();
                        _profit = getVal(_profit);
                    } else if (sectionTitle.includes('Revenue')) {
                        _revenue = elements1[k].nextSibling.innerText;
                        _revenue = _revenue.trim();
                        _revenue = getVal(_revenue);
                    }
                }
                for (let m = 0; m < _sectors.length; m++) {
                    const tokens = _sectors[m].split(',');
                    _industries = [..._industries, ...tokens.map(t => t.trim())];
                }

                let _l_description = '';
                // let _competitive_advantages = '';
                // let _customer_base = '';
                // let _competitors = '';
                // let _website = '';
                // let _patents = '';
                // let _sales = '';
                const elements2 = document.querySelectorAll('.sc-jephDI.cwoplS');
                for (k = 0; k < elements2.length; k++) {
                    const sectionTitle = elements2[k].innerText;
                    if (sectionTitle.includes('About the company')) {
                        _l_description = elements2[k].nextSibling.innerText.trim();
                    // } else if (sectionTitle.includes('Competitive advantages')) {
                    //     _competitive_advantages = elements2[k].nextSibling.innerText.trim();
                    // } else if (sectionTitle.includes('Customer base')) {
                    //     _customer_base = elements2[k].nextSibling.innerText.trim();
                    // } else if (sectionTitle.includes('Competitors')) {
                    //     _competitors = elements2[k].nextSibling.innerText.trim();
                    // } else if (sectionTitle.includes('Website')) {
                    //     _website = elements2[k].nextSibling.innerText.trim();
                    // } else if (sectionTitle.includes('Patents')) {
                    //     _patents = elements2[k].nextSibling.innerText.trim();
                    // } else if (sectionTitle.includes('Seller involvement following the sale')) {
                    //     _sales = elements2[k].nextSibling.innerText.trim();
                    }
                }
                // const _s_description = _l_description.length > 200 ? _l_description.substring(0, 200) + '...' : _l_description;

                let _images = Array.from(document.querySelectorAll(".ant-image-img")).map(e => e.src);

                // let _EBITDA_margin = '';
                // const elements3 = document.querySelectorAll('.sc-nTrUm.fDFFfQ');
                // for (k = 0; k < elements3.length; k++) {
                //     const sectionTitle = elements3[k].innerText;
                //     if (sectionTitle.includes('EBITDA margin')) {
                //         _EBITDA_margin = parseFloat(elements3[k].parentNode.nextSibling.innerText.trim());
                //         break;
                //     }
                // }

                let _seller_email = '';
                let _seller_name = '';
                let _seller_phone_number = '';
                const el = document.querySelector('.sc-eJKXev.dbLDKi');
                if (el) {
                    const tokens = el.innerText.trim().split('\n');
                    for (k = 0; k < tokens.length; k++) {
                        const token = tokens[k].trim();
                        if (token.startsWith('Name: ')) {
                            _seller_name = token.replace('Name: ', '');
                        } else if (token.startsWith('Email: ')) {
                            _seller_email = token.replace('Email: ', '');
                        } else if (token.startsWith('Phone: ')) {
                            _seller_phone_number = token.replace('Phone: ', '');
                        }
                    }
                }

                let lat = 0;
                let lon = 0;
                let response;
                let jsonResponse;

                let strUrl = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=1`;
                let strUrlUntilCountry = '';
                let strUrlUntilProvince = '';
                if (_country) {
                    strUrl += `&country=${_country}`;
                    strUrlUntilCountry = strUrl;
                }
                if (cityAndProvince['province_name']) {
                    strUrl += `&state=${cityAndProvince['province_name']}`;
                    strUrlUntilProvince = strUrl;
                }
                if (cityAndProvince['city']) {
                    strUrl += `&city=${cityAndProvince['city']}`;
                }
                response = await fetch(encodeURI(strUrl));
                jsonResponse = await response.json();
                if (jsonResponse.length) {
                    lat = parseFloat(jsonResponse[0]['lat']);
                    lon = parseFloat(jsonResponse[0]['lon']);
                } else {
                    if (strUrlUntilProvince) {
                        response = await fetch(encodeURI(strUrlUntilProvince));
                        jsonResponse = await response.json();
                        if (jsonResponse.length) {
                            lat = parseFloat(jsonResponse[0]['lat']);
                            lon = parseFloat(jsonResponse[0]['lon']);
                        } else {
                            if (strUrlUntilCountry) {
                                response = await fetch(encodeURI(strUrlUntilCountry));
                                jsonResponse = await response.json();
                                if (jsonResponse.length) {
                                    lat = parseFloat(jsonResponse[0]['lat']);
                                    lon = parseFloat(jsonResponse[0]['lon']);
                                }
                            }
                        }
                    } else {
                        if (strUrlUntilCountry) {
                            response = await fetch(encodeURI(strUrlUntilCountry));
                            jsonResponse = await response.json();
                            if (jsonResponse.length) {
                                lat = parseFloat(jsonResponse[0]['lat']);
                                lon = parseFloat(jsonResponse[0]['lon']);
                            }
                        }
                    }
                }

                return {
                    'business_name': _business_name,
                    'city': cityAndProvince['city'],
                    'province_id': cityAndProvince['province_id'],
                    'province_name': cityAndProvince['province_name'],
                    'country': _country,
                    "currency":"CAD",
                    'date_scraped': '',
                    // 'f_business_name': _business_name,
                    // 'f_l_description': _l_description,
                    // 'f_s_description': _s_description,
                    'foundedYear': _foundedYear,
                    'images': _images,
                    'industry': _industries,
                    'l_description': _l_description,
                    // 'listing_id': listingId,
                    'listing_url': document.URL,
                    'numOfViews': 0,
                    'numberOfEmployees': _numberOfEmployees,
                    'of_listing_id': '',
                    'price': isNaN(_price) ? 0 : _price,
                    'profit': isNaN(_profit) ? 0 : _profit,
                    'revenue': isNaN(_revenue) ? 0 : _revenue,
                    // 's_description': _s_description,
                    // 'sales': _sales,
                    'seller_email': _seller_email,
                    'seller_name': _seller_name,
                    'seller_phone_number': _seller_phone_number,
                    'source': 'acquizition.biz',
                    // 'comp_advan': _competitive_advantages,
                    // 'customer_base': _customer_base,
                    // 'competitors': _competitors,
                    // 'website': _website,
                    // 'patents': _patents,
                    // 'EBITDA_margin': isNaN(_EBITDA_margin) ? 0 : _EBITDA_margin,
                    'lat': lat,
                    'lon': lon,
                    'updatedAt': '',
                    'published': true,
                };
            });
            // Page evaluate end

            result.push(data);
        }

        console.log('666');

        fs.writeFile('test.txt', JSON.stringify(result, null, "\t"), err => {
            if (err) {
                console.error(err);
            } else {
                console.log('File write successful.');
            }
        });

        await browser.close();

        // fs.readFile("test.txt", async function(err, data) {
        //     if (err) throw err;

        //     const result = JSON.parse(data);

            console.log(`Saving ${result.length} results to ${OPENFAIR_COLLECTION_NAME}...`);

            console.log('Finished');
        // });
    } catch (error) {
        console.log(error);
    }
}

scraping();
