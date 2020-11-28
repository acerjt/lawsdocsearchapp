const postAjax = function(url, params) {
    return new Promise((resolve, reject) => {
        let httpRequest = new XMLHttpRequest();
        if (!httpRequest) {
            return reject(new Error('Giving up :( Cannot create an XMLHTTP instance'))
        }
        httpRequest.responseType = 'json'
        httpRequest.onreadystatechange = () => {
            if (httpRequest.readyState === XMLHttpRequest.DONE) {
                if (httpRequest.status === 200) {
                return resolve(httpRequest.response)
                } else {
                    return reject(new Error('There was a problem with the request.'));
                }
            }
        };
        httpRequest.open('POST', url);
        httpRequest.setRequestHeader("Content-Type", "application/json");
        httpRequest.send(params);
    })
};