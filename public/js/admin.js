function setAnswerNum() {
  let textSelect   = document.getElementById('text').checked || false;
  let singleSelect = document.getElementById('select').checked || false;
  let multiSelect  = document.getElementById('mselect').checked || false;

  let container = document.getElementById('select_num');

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
