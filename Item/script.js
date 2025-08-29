const params = new URLSearchParams(window.location.search);

const oldHash = params.get("oldHash");  // "123"
const eventId = params.get("eventId");

function closeWindow(){
    window.location.replace(`../${oldHash}`);
};