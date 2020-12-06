let averatePoint = document.getElementById('averate-rating').innerHTML
document.getElementById('averate-rating').style.color = getAverateRatingPointColor(averatePoint)
function calcRate(r) {
    const f = ~~r
    const id = 'star' + f
    id && (document.getElementById(id).checked = !0)
}

function getAverateRatingPointColor(averatePoint) {
    averatePoint = Math.floor(averatePoint)
    if(averatePoint === 5)
        return '#4CAF50'
    else if(averatePoint === 4)
        return '#2196F3'
    else if(averatePoint === 3)
        return '#00bcd4'
    else if(averatePoint === 2)
        return '#ff9800'
    else if(averatePoint === 1)
        return '#f44336'
}

function onRating(id) {
    let ratingValue = document.querySelector('input[name="rating"]:checked').value;
    let ratings = document.querySelectorAll('input[name="rating"]')
    ratings.forEach(rating => {
        rating.setAttribute('disabled', true)
    })
    let ratingIcon = document.querySelectorAll('.ratingIcon')
    ratingIcon.forEach(rating => rating.setAttribute('class', 'noHover'))
    let ratingData = {
        id: id,
        ratingValue: ratingValue
    }
    postAjax('laws/rating',JSON.stringify(ratingData)).then(rs => {
        console.log(rs)
        if(rs.s === 200) {
            let doc = rs.data
            let totalRating = doc.ratings['1'] + doc.ratings['2'] + doc.ratings['3'] + doc.ratings['4'] + doc.ratings['5']
            console.log(doc, totalRating)
            document.getElementById(`bar-1`).style.width = `${doc.ratings['1'] / totalRating * 100}%`
            document.getElementById(`bar-2`).style.width = `${doc.ratings['2'] / totalRating * 100}%`
            document.getElementById(`bar-3`).style.width = `${doc.ratings['3'] / totalRating * 100}%`
            document.getElementById(`bar-4`).style.width = `${doc.ratings['4'] / totalRating * 100}%`
            document.getElementById(`bar-5`).style.width = `${doc.ratings['5'] / totalRating * 100}%`
            document.getElementById(`totalRating${ratingValue}`).innerText = doc.ratings[`${ratingValue }`]
            document.getElementById(`averate-rating`).innerText = Math.round((doc.stars + Number.EPSILON) * 100) / 100
            document.getElementById('averate-rating-star-ratio-layer').style.width = `${doc.stars / 5 * 100}%`
            document.getElementById('averate-rating').style.color = getAverateRatingPointColor(doc.stars)
        }
    })
}