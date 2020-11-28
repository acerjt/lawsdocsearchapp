function calcRate(r) {
    const f = ~~r
    const id = 'star' + f
    id && (document.getElementById(id).checked = !0)
}

function onRating() {
    let ratingValue = document.querySelector('input[name="rating"]:checked').value;
    console.log(ratingValue)
    let ratings = document.querySelectorAll('input[name="rating"]')
    ratings.forEach(rating => {
        rating.setAttribute('disabled', true)
    })
    let ratingIcon = document.querySelectorAll('.ratingIcon')
    ratingIcon.forEach(rating => rating.setAttribute('class', 'noHover'))
    postAjax('/abc',JSON.stringify({hello:1})).then(rs => console.log(rs))
}