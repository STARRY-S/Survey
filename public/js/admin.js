function setAnswerNum() {
    let textSelect   = document.getElementById("text").checked || false;
    let singleSelect = document.getElementById("select").checked || false;
    let multiSelect  = document.getElementById("mselect").checked || false;

    let container = document.getElementById("select_num");

    if (singleSelect || multiSelect) {
        if (container.hasChildNodes()) {
            return;
        }

        const label = document.createTextNode("选项的数量 (2至5)：");
        const numInput = document.createElement("input");
        numInput.type = "number";
        numInput.name = "q_num";
        numInput.value = "3";
        numInput.max = "5";
        numInput.min = "2";

        container.appendChild(label);
        container.appendChild(numInput);
    } else if (textSelect) {
        while (container.hasChildNodes()) {
            container.removeChild(container.firstChild);
        }
    }
}

window.addEventListener("load", function() {
    var now = new Date();
    var utcString = now.toISOString().substring(0,19);
    var year = now.getFullYear();
    var month = now.getMonth() + 1;
    var day = now.getDate() + 1; // +1
    var hour = now.getHours();
    var minute = now.getMinutes();
    var second = now.getSeconds();
    var localDatetime = year + "-" +
                      (month < 10 ? "0" + month.toString() : month) + "-" +
                      (day < 10 ? "0" + day.toString() : day) + " " +
                      (hour < 10 ? "0" + hour.toString() : hour) + ":" +
                      (minute < 10 ? "0" + minute.toString() : minute) +
                      utcString.substring(16,19);
    var datetimeField = document.getElementById("end_time");
    // datetimeField.value = localDatetime;
    datetimeField.min = localDatetime;
});
