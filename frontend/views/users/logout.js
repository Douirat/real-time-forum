import { navigateTo } from "../../router/router.js";
import { worker, sendMessage } from "../chat/worker.js";

// logout logic
export function logout() {
  let btn = document.querySelector(".logout");
  btn.addEventListener("click", () => {
    fetch("http://localhost:8080/logout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then(async (response) => {
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(errorText);
        }
        worker.port.start();
        sendMessage(worker, { type: "logout" });
        navigateTo("/login");
        return response.json();
      })
      .then((data) => () => {
        // console.log(data)
      })
      .catch((errorText) => console.log("Error:", errorText));
  });
}
