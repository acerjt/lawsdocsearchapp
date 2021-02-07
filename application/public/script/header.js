function onInputAutocomplete(text) {
    callAjax('POST', 'vbpl/autocomplete', {text}).then(rs => {
        if(rs.s === 200) {
            let doc = rs.data
            let text = ''
            doc.forEach(element => {
                text+= `<div class="autocomplete-suggestion">
                            <div class="search-item">
                                <div class="info">
                                <h2>
                                    <a style="font-size: 18px" href="${element._source.href}" target="_blank" >${element._source.name}</a>
                                    <i style="font-size: 18px">${element._source.effectiveStatus}</i>
                                </h2>
                                <div style="font-size: 17px">
                                    ${element._source.desc}
                                </div>
                                </div>
                            </div>
                        </div> `
            });
            let autoSuggestionElement = document.getElementById('autocomplete-suggestions')
            autoSuggestionElement.innerHTML = text
        }
    })
}

function displayAutoSuggestionPanel() {
    let autoSuggestionElement = document.getElementById('autocomplete-suggestions')
    let searchInputElement = document.getElementById('search-input')
    let searchInputBoundingData = searchInputElement.getBoundingClientRect()
    autoSuggestionElement.style.left = searchInputBoundingData.left
    autoSuggestionElement.style.width = searchInputBoundingData.width 
    autoSuggestionElement.style.top = searchInputBoundingData.top + searchInputBoundingData.height
    autoSuggestionElement.style.display = 'block'
}

function hideAutoSuggestionPanel() {
    let autoSuggestionElement = document.getElementById('autocomplete-suggestions')
    setTimeout(() => {
        autoSuggestionElement.style.display = 'none'
    }, 1000)
}

function search() {
    let keyword = document.getElementById('search-input').value
    let isAdvancedSearch = document.getElementById('advanced-search').checked

    if(!isAdvancedSearch) {
        if(!keyword)
            return false
        window.location.href = `vbpl?keyword=${keyword}`
            // callAjax('GET', 'vbpl', {keyword}).then(rs => {
        //     console.log(rs)
        // })
    }
}

function onInputAutocomplete1(text) {
    callAjax('POST', 'vbpl/autocompletedoctype', {text}).then(rs => {
        if(rs.s === 200) {
            let doc = rs.data
            let text = ''
            doc.forEach(element => {
                text+= `<div class="autocomplete-suggestion1">
                            <p style="font-size: 16px; color: black; margin-bottom: 0px !important; padding: 5px 10px 5px 10px;" >${element}</p>
                        </div> `
            });
            let autoSuggestionElement = document.getElementById('autocomplete-suggestions1')
            autoSuggestionElement.innerHTML = text
        }
    })
}

function displayAutoSuggestionPanel1() {
    let autoSuggestionElement = document.getElementById('autocomplete-suggestions1')
    let searchInputElement = document.getElementById('inputDocType')
    let searchInputBoundingData = searchInputElement.getBoundingClientRect()
    autoSuggestionElement.style.left = searchInputBoundingData.left
    autoSuggestionElement.style.width = searchInputBoundingData.width 
    autoSuggestionElement.style.top = searchInputBoundingData.top + searchInputBoundingData.height
    autoSuggestionElement.style.display = 'block'
}

function hideAutoSuggestionPanel1() {
    let autoSuggestionElement = document.getElementById('autocomplete-suggestions1')
    setTimeout(() => {
        autoSuggestionElement.style.display = 'none'
    }, 1000)
}

function onInputAutocompleteByField(text) {
    callAjax('POST', 'vbpl/autocompletefield', {text}).then(rs => {
        if(rs.s === 200) {
            let doc = rs.data
            let text = ''
            doc.forEach(element => {
                text+= `<div class="autocomplete-suggestion-field">
                            <p style="font-size: 16px; color: black; margin-bottom: 0px !important; padding: 5px 10px 5px 10px;" >${element}</p>
                        </div> `
            });
            let autoSuggestionElement = document.getElementById('autocomplete-suggestions-field')
            autoSuggestionElement.innerHTML = text
        }
    })
}

function displayAutoSuggestionPanelByField() {
    let autoSuggestionElement = document.getElementById('autocomplete-suggestions-field')
    let searchInputElement = document.getElementById('inputField')
    let searchInputBoundingData = searchInputElement.getBoundingClientRect()
    autoSuggestionElement.style.left = searchInputBoundingData.left
    autoSuggestionElement.style.width = searchInputBoundingData.width 
    autoSuggestionElement.style.top = searchInputBoundingData.top + searchInputBoundingData.height
    autoSuggestionElement.style.display = 'block'
}

function hideAutoSuggestionPanelByField() {
    let autoSuggestionElement = document.getElementById('autocomplete-suggestions-field')
    setTimeout(() => {
        autoSuggestionElement.style.display = 'none'
    }, 1000)
}

function onInputAutocompleteSignedBy(text) {
    callAjax('POST', 'vbpl/autocompletesignedby', {text}).then(rs => {
        if(rs.s === 200) {
            let doc = rs.data
            let text = ''
            doc.forEach(element => {
                text+= `<div class="autocomplete-suggestion-signedby">
                            <p style="font-size: 16px; color: black; margin-bottom: 0px !important; padding: 5px 10px 5px 10px;" >${element}</p>
                        </div> `
            });
            let autoSuggestionElement = document.getElementById('autocomplete-suggestions-signedby')
            autoSuggestionElement.innerHTML = text
        }
    })
}

function displayAutoSuggestionPanelSignedBy() {
    let autoSuggestionElement = document.getElementById('autocomplete-suggestions-signedby')
    let searchInputElement = document.getElementById('inputSignedBy')
    let searchInputBoundingData = searchInputElement.getBoundingClientRect()
    autoSuggestionElement.style.left = searchInputBoundingData.left
    autoSuggestionElement.style.width = searchInputBoundingData.width 
    autoSuggestionElement.style.top = searchInputBoundingData.top + searchInputBoundingData.height
    autoSuggestionElement.style.display = 'block'
}

function hideAutoSuggestionPanelSignedBy() {
    let autoSuggestionElement = document.getElementById('autocomplete-suggestions-signedby')
    setTimeout(() => {
        autoSuggestionElement.style.display = 'none'
    }, 1000)
}

function onInputAutocompleteAgencyIssued(text) {
    callAjax('POST', 'vbpl/autocompleteagencyissued', {text}).then(rs => {
        if(rs.s === 200) {
            let doc = rs.data
            let text = ''
            doc.forEach(element => {
                text+= `<div class="autocomplete-suggestion-agencyissued">
                            <p style="font-size: 16px; color: black; margin-bottom: 0px !important; padding: 5px 10px 5px 10px;" >${element}</p>
                        </div> `
            });
            let autoSuggestionElement = document.getElementById('autocomplete-suggestions-agencyissued')
            autoSuggestionElement.innerHTML = text
        }
    })
}

function displayAutoSuggestionPanelAgencyIssued() {
    let autoSuggestionElement = document.getElementById('autocomplete-suggestions-agencyissued')
    let searchInputElement = document.getElementById('inputAgencyIssued')
    let searchInputBoundingData = searchInputElement.getBoundingClientRect()
    autoSuggestionElement.style.left = searchInputBoundingData.left
    autoSuggestionElement.style.width = searchInputBoundingData.width 
    autoSuggestionElement.style.top = searchInputBoundingData.top + searchInputBoundingData.height
    autoSuggestionElement.style.display = 'block'
}

function hideAutoSuggestionPanelAgencyIssued() {
    let autoSuggestionElement = document.getElementById('autocomplete-suggestions-agencyissued')
    setTimeout(() => {
        autoSuggestionElement.style.display = 'none'
    }, 1000)
}