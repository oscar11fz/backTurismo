const { authCtrl } = require("../controllers/events.controller");
const express = require("express");

const router = express.Router();

//GET
router.get("/getEvents", authCtrl.getEvents);
router.get("/getDataEvent", authCtrl.getDataEvent);
router.get("/getEventApp", authCtrl.getEventApp);
//POST
router.post("/events", authCtrl.events);
router.post("/postEvents", authCtrl.postEvents);

//PUT
router.put("/updateEvent/:idEvent", authCtrl.updateEvent);
router.put("/updateStateEvent/:idEvent", authCtrl.updateStateEvent);

//DELETE
router.delete("/deleteEvent/:idEvent", authCtrl.deleteEvent);
module.exports = router;
