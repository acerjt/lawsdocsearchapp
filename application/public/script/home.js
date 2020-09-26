function changeIconCircleDown() {
    let isExpanded = $('#click-change-icon').attr("aria-expanded")
    if (isExpanded == "true") {
        $('#icon-fa-arrow-circle-up').removeClass("fa-arrow-circle-up")
        $('#icon-fa-arrow-circle-up').addClass("fa-arrow-circle-down")
    } else {
        $('#icon-fa-arrow-circle-up').removeClass("fa-arrow-circle-down")
        $('#icon-fa-arrow-circle-up').addClass("fa-arrow-circle-up")
    }
} 