module.exports = async function (context) {
  return {
    status: 200,
    body: "You've successfully deployed a Function App!",
    headers: {
      "content-type": "text/html",
    },
  };
};
