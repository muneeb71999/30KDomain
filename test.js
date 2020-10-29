const whois = require("whois-checker-v2");

(async () => {
  try {
    const result = await whois.lookup("adaderana.lk");
    console.log(result);
  } catch (error) {
    console.error(error);
  }
})();
