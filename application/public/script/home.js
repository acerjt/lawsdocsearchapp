function updateQueryStringParameter(key, value) {
    let uri = window.location.href
    key = key.toLowerCase().split(' ').map(item => item[0]).join('')
    let re = new RegExp("([?&])" + key + "=.*?(&|$)", "i");
    let re2 = new RegExp("([&])" + key + "=.*?(&)", "i");
    let re3 = new RegExp("([&])" + key + "=.*?($)", "i");
    let re4 = new RegExp("([?])" + key + "=.*?(&)", "i");
    let re5 = new RegExp("([?])" + key + "=.*?($)", "i");

    let separator = uri.indexOf('?') !== -1 ? "&" : "?";
    if(value === '') {
        let href = uri
        if (uri.match(re2))
            href = uri.replace(re2, '&')
        else if (uri.match(re3))
            href = uri.replace(re3, '')
        else if(uri.match(re4))
            href = uri.replace(re4, '?')
        else if(uri.match(re5))
            href = uri.replace(re5, '')
        if(key !== 'p')
            href = href.replace(/&p=\d+/, '')
        window.location =  href
    }
    else if (uri.match(re)) {
        let href = uri.replace(re, '$1' + key + "=" + value + '$2')
        if(key !== 'p') {
            href = href.replace(/&p=\d+/, '')
            href = href.replace(/\?p=\d+/, '?')
        }
        console.log(href)
        window.location =  href
    }
    else {
        let href = uri + separator + key + "=" + value
        if(key !== 'p') {
            href = href.replace(/&p=\d+/, '')
            href = href.replace(/\?p=\d+/, '?')
        }
        console.log(href)        
        window.location =  href
    }
}