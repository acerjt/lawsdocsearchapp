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
                                    <a href="${element._source.href}" target="_blank" >${element._source.name}</a>
                                    <i>${element._source.effectiveStatus}</i>
                                </h2>
                                <h3>
                                    ${element._source.desc}
                                </h3>
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