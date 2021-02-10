function onInputAutocomplete(text) {
    callAjax('POST', 'vbpl/autocomplete', {text}).then(rs => {
        if(rs.s === 200) {
            let doc = rs.data
            let text = ''
            doc.forEach(element => {
                text+= `<div class="autocomplete-suggestion">
                            <div class="search-item" onclick="bindindSuggestionText(this, 'search-input')">
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
    }, 300)
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
                text+= `<div class="autocomplete-suggestion1" onMouseDown="bindingText(this, 'inputDocType')">
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
    autoSuggestionElement.style.display = 'none'
}

function onInputAutocompleteByField(text) {
    callAjax('POST', 'vbpl/autocompletefield', {text}).then(rs => {
        if(rs.s === 200) {
            let doc = rs.data
            let text = ''
            doc.forEach(element => {
                text+= `<div class="autocomplete-suggestion-field" onMouseDown="bindingText(this, 'inputField')">
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
    autoSuggestionElement.style.display = 'none'
}

function onInputAutocompleteSignedBy(text) {
    callAjax('POST', 'vbpl/autocompletesignedby', {text}).then(rs => {
        if(rs.s === 200) {
            let doc = rs.data
            let text = ''
            doc.forEach(element => {
                text+= `<div class="autocomplete-suggestion-signedby" onMouseDown="bindingText(this, 'inputSignedBy')">
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
    autoSuggestionElement.style.display = 'none'
}

function onInputAutocompleteAgencyIssued(text) {
    callAjax('POST', 'vbpl/autocompleteagencyissued', {text}).then(rs => {
        if(rs.s === 200) {
            let doc = rs.data
            let text = ''
            doc.forEach(element => {
                text+= `<div class="autocomplete-suggestion-agencyissued" onMouseDown="bindingText(this, 'inputAgencyIssued')">
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
    autoSuggestionElement.style.display = 'none'
}

function bindingText(element, elementID){
    let inputID = document.getElementById(elementID)
    inputID.value = element.children[0].innerText
}

function bindindSuggestionText(element, elementID){
    let inputID = document.getElementById(elementID)
    inputID.value = element.children[0].children[0].children[0].innerText
}

let today = new Date().toISOString().substr(0, 10);
let inputEffectiveDate = document.getElementById('inputEffectiveDate')
inputEffectiveDate.value = today

let inputIssuedDate = document.getElementById('inputIssuedDate')
inputIssuedDate.value = today
