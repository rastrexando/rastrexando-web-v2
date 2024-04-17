const main = document.querySelector("main")
const upWrapper = document.querySelector("#up-wrapper")

upWrapper.addEventListener("click", function() {
  main.scrollTo({ top: 0, behavior: "smooth" });
})

main.addEventListener("scroll", function($event) {
  console.log(main.scrollTop)
  if (main.scrollTop > 100) {
    upWrapper.style.display = 'block';
  } else {
    upWrapper.style.display = 'none';
  }
})
