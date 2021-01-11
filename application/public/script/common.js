// const callAjax = function(method, url, params) {
//     return new Promise((resolve, reject) => {
//         let httpRequest = new XMLHttpRequest();
//         if (!httpRequest) {
//             return reject(new Error('Giving up :( Cannot create an XMLHTTP instance'))
//         }
//         httpRequest.responseType = 'json'
//         httpRequest.onreadystatechange = () => {
//             if (httpRequest.readyState === XMLHttpRequest.DONE) {
//                 if (httpRequest.status === 200) {
//                 return resolve(httpRequest.response)
//                 } else {
//                     return reject(new Error('There was a problem with the request.'));
//                 }
//             }
//         };

//         httpRequest.open(method, url);
//         httpRequest.setRequestHeader("Content-Type", "application/json");
//         httpRequest.send(params);
//     })
// };

const callAjax = async (method = '', url = '', params) => {
    // Default options are marked with *
    let options = {
        method: method, // *GET, POST, PUT, DELETE, etc.
        mode: 'cors', // no-cors, *cors, same-origin
        cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
        credentials: 'same-origin', // include, *same-origin, omit
        headers: {
            'Content-Type': 'application/json'
            // 'Content-Type': 'application/x-www-form-urlencoded',
        },
        redirect: 'follow', // manual, *follow, error
        referrerPolicy: 'no-referrer', // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
    }
    if(method.toLowerCase() === 'get') {
        url = new URL(window.location.origin + '/' + url)
        url.search = new URLSearchParams(params).toString()
        console.log(url)
    }
    if(method.toLowerCase() === 'post') {
        options.body = JSON.stringify(params)
    }
    const response = await fetch(url, options);
    return response.json(); // parses JSON response into native JavaScript objects
}