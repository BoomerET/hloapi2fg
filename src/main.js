// Sample client for accessing Hero Lab® Online Public API
// Copyright © 2020 LWD Technology, Inc. All rights reserved.

import * as signalR from '@aspnet/signalr'

//NOTE! The constants below need to be setup appropriately with your own details for testing.

const TOOL_NAME = "ai6k_hlo_fvtt"
//var USER_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjIxNDc0ODM2NDcsImhsbyI6IlgtUmc5QlBEc24ycEpURzd6RnhIQkU4QUVoU1lKRWhyRDZTcVNuWXFOb2x4Yk56eXc2T2xRU3RpNzZVaHhzVSJ9.tVHE0zn_YIlX97EUWf0nnf8RDXzcyMopdTdnxFmdikU"
//var ELEMENT_TOKEN = "$lDFV9QG~@SF#"
var USER_TOKEN = ""
var ELEMENT_TOKEN = ""

var startXML = "<?xml version=\"1.0\" encoding=\"utf-8\"?>\n"
startXML += "<root version=\"4\" dataversion=\"20201016\" release=\"19|CoreRPG:4\">\n"
startXML += "\t<character>\n"
var endXML = "\t</character>\n</root>\n"
var allXML = ""

var pcFilename = ""
var object;

var thisIteration = 0
var totalSkills = 0
var fullTheme = ""
var classCount = 0
var charRaceText = ""
var charRaceType = ""
var littleTheme = ""
var charClass = ""
var smallCharClass = ""
var charSpeed = "";
var charTotalHP = "";
var charCurrHP = "";
var charCurrSP = "";
var charTotalSP = "";
var charTotalRP = "";
var charCurrRP = "";
var getArchetype = "";
var keyAbility = "";
var baseRanks = "";
var compScore = 0;
var ranksTotal = 0;
var classLevel = "";
var soldierArray = ["Acrobatics", "Athletics", "Engineering", "Intimidate", "Medicine", "Piloting", "Survival"];
var envoyArray =  ["Acrobatics", "Athletics", "Bluff", "Computers", "Culture", "Diplomacy", "Disguise", "Engineering", "Intimidate", "Medicine", "Perception", "Piloting", "Sense Motive", "Sleight of Hand", "Stealth"];
var mechanicArray =  ["Athletics", "Computers", "Engineering", "Medicine", "Perception", "Piloting"];
var mysticArray =  ["Bluff", "Culture", "Diplomacy", "Intimidate", "Life Science", "Medicine", "Mysticism", "Perception", "Sense Motive", "Survival"];
var operativeArray =  ["Acrobatics", "Athletics", "Bluff", "Computers", "Culture", "Disguise", "Engineering", "Intimidate", "Medicine", "Perception", "Piloting", "Sense Motive", "Sleight of Hand", "Stealth", "Survival"];
var solarianArray =  ["Acrobatics", "Athletics", "Diplomacy", "Intimidate", "Mysticism", "Perception", "Physical Science", "Sense Motive", "Stealth"];
var technomancerArray =  ["Computers", "Engineering", "Life Science", "Mysticism", "Physical Science", "Piloting", "Sleight of Hand"];
var skillDex = ["Acrobatics", "Piloting", "Sleight of Hand", "Stealth"]
var skillStr = ["Athletics"]
var skillCha = ["Bluff", "Diplomacy", "Disguise", "Intimidate"]
var skillInt = ["Computers", "Culture", "Engineering", "Life Science", "Medicine", "Physical Science"]
var skillWis = ["Mysticism", "Perception", "Sense Motive", "Survival"]



//NOTE! The constants below should not need to be changed.

const PROTOCOL = "https://"
const API_HOST = PROTOCOL + "api.herolab.online"
const SIGNALR_ROUTE = "/api-signalr"
const CALLBACK = "Callback"
const NOTIFY = "Hlo_Notify"

// jquery? jsdom?
//const { JSDOM } = require( "jsdom" )
//const { window } = new JSDOM( "" )
//const $ = require( "jquery" )( window )
import $ from 'jquery';
window.jQuery = window.$ = $;
//$(selector).hide();

//NOTE! The variables below are setup dynamically during execution.

let connection = null
let accessToken = null
let signalrHost = null
let gameServer = null

main()

async function main() {
   //verify the necessary values are configured
   //assert(!!TOOL_NAME, "Tool name not configured")
   //assert(!!USER_TOKEN, "User token not configured")
   //assert(!!ELEMENT_TOKEN, "Element token not configured")

   //acquire an access token for use from the public api
   await acquireAccessToken()

   //retrieve the url to connect to for signalr
   await determineHost()

   //set everything up and connect to signalr to receive notifications
   setup()
   await connect()

   //make some basic calls of increasing behavior to verify signalr communication is working
   await ping()
   await parrot()
   await authenticateParrot()

   //make a call that sends a notification message back to us
   //NOTE! Give the message a chance to be received before proceeding.
   await inform()
   $('#grabChar').on("click", function() {
      USER_TOKEN = $('#userToken').val()
      ELEMENT_TOKEN = $('#elementToken').val()
      getCharacter()
   })
   setTimeout(async () => {
      //attach to the game server
      await attachServer()

      //subscribe to the element token
      //await subscribeElement()
      //await getCharacter()

      //start waiting for notifications from HLO that are simply output as console messages
      //console.log("Waiting for notifications. Press \"Space\" to exit...")

      //listen for key presses
      //window.addEventListener("keyup", async (event) => {
         //ignore anything that isn't the space key
         //NOTE! This is important since browser shortcuts like F12 etc. will
         //      be delivered to the window, and we don't want to close in those
         //      cases.
      //   if (event.key !== " " && event.keyCode !== 32) {
      //     return;
      //   }
   
         //unsubscribe from everything
         //await unsubscribeAll()
   
         //pause before exiting so any errors from unsubscribe can be read
         //console.log("Exiting in 5 seconds...")
         //setTimeout(() => {
         //  window.close()
         //}, 5000)
       //})
   }, 300)
}

async function acquireAccessToken() {
   //construct and submit a request to acquire an access token
   const route = "/v1/access/acquire-access-token"
   const request = {
      refreshToken: USER_TOKEN, 
      toolName: TOOL_NAME,
      callerId: 123
   }
   const response = await submitRequest(route, request)

   //extract the access token
   accessToken = response.accessToken
}

async function determineHost() {
   //construct the request to retrieve the host to contact for notifications
   const route = "/v1/access/identify-notification-server"
   const request = {
      accessToken: accessToken,
      elementToken: ELEMENT_TOKEN,
      callerId: 123
   }
   const response = await submitRequest(route, request)

   //extract the signalr host and game server
   signalrHost = response.host
   gameServer = response.gameServer
}

async function attachServer() {
   //construct the request to attach to the game server
   const route = "/v1/access/attach-game-server";
   const request = {
      accessToken: accessToken,
      gameServer: gameServer,
      callerId: 123
   }
   const response = await submitRequest(route, request)

   //there is nothing to do with the response - it's merely an acknowledgement
   assert(typeof response === 'object', 'attachServer response')
}

async function subscribeElement() {
   //construct the request to subscribe to the element token
   const route = "/v1/character/subscribe"
   const request = {
      accessToken: accessToken,
      elementToken: ELEMENT_TOKEN,
      baseline: 0,
      callerId: 123
   }
   const response = await submitRequest(route, request)

   //there is nothing to do with the response - it's merely an acknowledgement
   assert(typeof response === 'object', 'subscribeElement response')
}

async function getCharacter() {
   // construct the request to get a character
   const route = "/v1/character/get"
   const request = {
       accessToken: accessToken,
       elementToken: ELEMENT_TOKEN,
       baseline: 0,
       callerId: 123
   }
   const response = await submitRequest(route, request)

   // We will want to post the results, crossing fingers
   //console.log("Hi Dave")
   //var obj = JSON.parse(response)
   //var pretty = JSON.stringify(obj, undefined, 4)
   var charString = JSON.stringify(response)
   document.getElementById('charJSON').value = charString
   //console.log("our object: %o", response)
   //$('#charJSON').val(response)
   //document.getElementById('charJSON').value = 
   //assert(typeof response === 'object', 'getCharacter response')
   $('#buildChar').on("click", function() {
        //console.log("Button clicked")
        var character = jQuery.extend(true, {}, response)
        //console.log(character)
        var buildXML = startXML;
        $.each(character.export.actors, function(index, element) {
            buildXML += "\t\t<name type=\"string\">" + element.name + "</name>\n";
            pcFilename = element.name;  
        });
        $.each(character.export.actors, function(i, v) {
            // Race
            $.each(v.gameValues, function(k, x) {
                if (k == "actTypeText") {
                    charRaceText = x;
                } else if (k == "actRace") {
                    charRaceType = x;
                } else if (k == "actAlignment") {
                    buildXML += "\t\t<alignment type=\"string\">" + x + "</alignment>\n";
                }
            });
            buildXML += "\t\t<race type=\"string\">" + charRaceText + "</race>\n";
            buildXML += "\t\t<racelink type=\"windowreference\">\n";
            buildXML += "\t\t\t<class>race</class>\n";
            buildXML += "\t\t\t<recordname>reference.race." + charRaceType + "@*</recordname>\n";
            buildXML += "\t\t</racelink>\n";
         
            // Theme
            $.each(v.items, function(j, w) {
                if (w.compset == "Ability") {
                    // Find theme knowledge to get Theme, abThemeKnowSpa.139
                    var themeKnow = j.substring(0,11);
                    if (themeKnow == "abThemeKnow") {
                        var thisTheme = j.substring(11,14);
 
                        switch(j.substring(11,14)) {
                            case "AcP":
                                fullTheme = "Ace Pilot";
                                littleTheme = "acepilot";
                                break;
                            case "Bio":
                                fullTheme = "Biotechnician";
                                littleTheme = "biotechnician";
                                break;
                            case "BoH":
                                fullTheme = "Bounty Hunter";
                                littleTheme = "bountyhunter";
                                break;
                            case "CoA":
                                fullTheme = "Corporate Agent";
                                littleTheme = "corporateagent";
                                break;
                            case "Cul":
                                fullTheme = "Cultist";
                                littleTheme = "cultist";
                                break;
                            case "Cyb":
                                fullTheme = "Cyberborn";
                                littleTheme = "cyberborn";
                                break;
                            case "DTo":
                                fullTheme = "Death-Touched";
                                littleTheme = "deathtouched";
                                break;
                            case "Dra":
                                fullTheme = "Dragonblood";
                                littleTheme = "dragonblood";
                                break;
                            case "DrP":
                                fullTheme = ">Dream Prophet";
                                littleTheme = "dreamprophet";
                                break;
                            case "Gla":
                                fullTheme = "Gladiator";
                                littleTheme = "gladiator";
                                break;
                            case "Ico":
                                fullTheme = "Icon";
                                littleTheme = "icon";
                                break;
                            case "Mer":
                                fullTheme = "Mercenary";
                                littleTheme = "mercenary";
                                break;
                            case "Out":
                                fullTheme = "Outlaw";
                                littleTheme = "outlaw";
                                break;
                            case "Pri":
                                fullTheme = "Priest";
                                littleTheme = "priest";
                                break;
                            case "Rob":
                                fullTheme = "Roboticist";
                                littleTheme = "roboticist";
                                break;
                            case "Sch":
                                fullTheme = "Scholar";
                                littleTheme = "scholar";
                                break;
                            case "SoD":
                                fullTheme = "Solar Disciple";
                                littleTheme = "solardisciple";
                                break;
                            case "SPi":
                                fullTheme = "Space Pirate";
                                littleTheme = "spacepirate";
                                break;
                            case "Spa":
                                fullTheme = "Spacefarer";
                                littleTheme = "spacefarer";
                                break;
                            case "TeP":
                                fullTheme = "Tempered Pilgrim";
                                littleTheme = "temperedpilgrim";
                                break;
                            case "WiW":
                                fullTheme = "Wild Warden";
                                littleTheme = "wildwarden";
                                break;
                            case "Xna":
                                fullTheme = "Xenoarchaeologist";
                                littleTheme = "xenoarchaeologist";
                                break;
                            case "Xen":
                                fullTheme = "Xenoseeker";
                                littleTheme = "xenoseeker";
                                break;
                            default:
                                fullTheme = "Themeless";
                             littleTheme = "themeless";
                        }
                    }
                }
            });
            buildXML += "\t\t<theme type=\"string\">" + fullTheme + "</theme>\n";
            buildXML += "\t\t<themelink type=\"windowreference\">\n";
            buildXML += "\t\t\t<class>theme</class>\n";
            buildXML += "\t\t\t<recordname>reference.theme." + littleTheme + "@*</recordname>\n";
            buildXML += "\t\t</themelink>\n";
            buildXML += "\t\t<themerecord type=\"string\">reference.theme." + littleTheme + "@*</themerecord>\n";
 
            // Class
            buildXML += "\t\t<classes>\n";
            classCount = 1;
            $.each(v.items, function(j, w) {
                if (w.compset == "Class") {
                    thisIteration = pad(classCount, 5);
                    buildXML += "\t\t\t<id-" + thisIteration + ">\n";
                    // Check to see if we even have an archetype
                    if (w.name.indexOf('(') == -1) {
                        console.log("No archetype");
                    } else {
                        getArchetype = w.name.split("(")[1].split(")")[0];
                    }
                    //getArchetype = w.name.split("(")[1].split(")")[0];
                    charClass = w.name.split("(")[0].trim();
                    if (classCount > 1) {
                        classLevel += " / " + charClass + " " + w.clLevelNet;
                    } else {
                        classLevel = charClass + " " + w.clLevelNet;
                    }
                    smallCharClass = charClass.toLowerCase().replace(/[ _-]/g, '');
                    //console.log("Class reference: " + smallCharClass);
 
                    switch(smallCharClass) {
                        case "envoy":
                            buildXML += "\t\t\t\t<classkey type=\"string\">Charisma</classkey>\n";
                            keyAbility = "charisma";
                            baseRanks = 8;
                            break;
                        case "mechanic":
                            buildXML += "\t\t\t\t<classkey type=\"string\">Intelligence</classkey>\n";
                            keyAbility = "intelligence";
                            baseRanks = 4;
                            break;
                        case "mystic":
                            buildXML += "\t\t\t\t<classkey type=\"string\">Wisdom</classkey>\n";
                            keyAbility = "wisdom";
                            baseRanks = 6;
                            break;
                        case "operative":
                            buildXML += "\t\t\t\t<classkey type=\"string\">Dexterity</classkey>\n";
                            keyAbility = "dexterity";
                            baseRanks = 8;
                            break;
                        case "solarian":
                            buildXML += "\t\t\t\t<classkey type=\"string\">Charisma</classkey>\n";
                            keyAbility = "charisma";
                            baseRanks = 4;
                            break;
                        case "soldier":
                            buildXML += "\t\t\t\t<classkey type=\"string\">Strength</classkey>\n";
                            keyAbility = "strength";
                            baseRanks = 4;
                            break;
                        case "technomancer":
                            buildXML += "\t\t\t\t<classkey type=\"string\">Intelligence</classkey>\n";
                            keyAbility = "intelligence";
                            baseRanks = 4;
                            break;
                        default:
                            buildXML += "\t\t\t\t<classkey type=\"string\">None</classkey>\n";
                    }
                    // FIXME, what is this?
                    buildXML += "\t\t\t\t<classkeymod type=\"number\">0</classkeymod>\n";
 
                    // class ranks depends on class and intelligence
                    $.each(v.items, function(j, w) {
                        if (w.compset == "AbilScore") {
                            //if (w.name == "Intelligence") {
                            compScore = Math.floor((parseInt(w.stNet) - 10) / 2);
                        }
                    });
 
                    ranksTotal = parseInt(baseRanks) + compScore;
                    buildXML += "\t\t\t\t<classskillranks type=\"number\">" + ranksTotal.toString() + "</classskillranks>\n";
 
                    // FIXME, what is this?
                    //buildXML += "\t\t\t\t<classstamina type=\"number\">6</classstamina>\n";
 
                    if (getArchetype != "") {
                        buildXML += "\t\t\t\t<archetype type=\"string\">" + getArchetype + "</archetype>\n";
                        buildXML += "\t\t\t\t<archetypelink type=\"windowreference\">\n";
                        buildXML += "\t\t\t\t\t<class>archetype</class>\n";
                        buildXML += "\t\t\t\t\t<recordname>reference.archetype." + getArchetype.toLowerCase().replace(/[ _-]/g, '') + "@*</recordname>\n";
                        buildXML += "\t\t\t\t</archetypelink>\n";
                    }
                    buildXML += "\t\t\t\t<name type=\"string\">" + charClass + "</name>\n";
                    buildXML += "\t\t\t\t<level type=\"number\">" + w.clLevelNet + "</level>\n";
                    buildXML += "\t\t\t\t<shortcut type=\"windowreference\">\n";
                    buildXML += "\t\t\t\t\t<class>class</class>\n";
                    buildXML += "\t\t\t\t\t<recordname>reference.class." + smallCharClass + "@*</recordname>\n";
                    buildXML += "\t\t\t\t</shortcut>\n";
                    buildXML += "\t\t\t\t<skillranks type=\"number\">" + baseRanks + "</skillranks>\n";
                    buildXML += "\t\t\t</id-" + thisIteration + ">\n";
                    classCount += 1;
                }
            });
            buildXML += "\t\t</classes>\n";
            buildXML += "\t\t<classlevel type=\"string\">" + classLevel + "</classlevel>\n";
 
            // Abilities
            buildXML += "\t\t<abilities>\n";
            $.each(v.items, function(j, w) {
                if (w.compset == "AbilScore") {
                    buildXML += "\t\t\t<" + w.name.toLowerCase() + ">\n";
                    buildXML += "\t\t\t\t<score type=\"number\">" + w.stNet + "</score>\n";
                    if (w.hasOwnProperty("stAbScModifier")) {
                        buildXML += "\t\t\t\t<bonus type=\"number\">" + w.stAbScModifier + "</bonus>\n";
                    } else {
                        buildXML += "\t\t\t\t<bonus type=\"number\">0</bonus>\n";
                    }
                    buildXML += "\t\t\t</" + w.name.toLowerCase() + ">\n";
                } else if (w.compset == "Movement") {
                    charSpeed = w. stNet;
                } else if (w.compset == "Reserves") {
                    if (w.name == "Hit Points") {
                        charTotalHP = w.rvMax;
                        charCurrHP = w.rvCurrent;
                    } else if (w.name == "Stamina") {
                        charTotalSP = w.rvMax;
                        charCurrSP = w.rvCurrent;
                    } else if (w.name == "Resolve Points") {
                        charTotalRP = w.rvMax;
                        charCurrRP = w.rvCurrent;
                    }
                } 
            });
 
            // FIXME
            //buildXML += "\t\t\t<key type=\"number\">42</key>\n";
            buildXML += "\t\t\t<keyability type=\"string\">" + keyAbility +"</keyability>\n";
            // FIXME
            //buildXML += "\t\t\t<keyabilitymod type=\"number\">45</keyabilitymod>\n";
            buildXML += "\t\t</abilities>\n";
 
            // Stamina points
            buildXML += "\t\t<sp>\n";
            buildXML += "\t\t\t<current type=\"number\">" + charCurrSP + "</current>\n";
            buildXML += "\t\t\t<fatique type=\"number\">0</fatique>\n";
            buildXML += "\t\t\t<mod type=\"number\">0</mod>\n";
            buildXML += "\t\t\t<temporary type=\"number\">0</temporary>\n";
            buildXML += "\t\t\t<total type=\"number\">" + charTotalSP + "</total>\n";
            buildXML += "\t\t</sp>\n";
 
            // Skills
            totalSkills = 1;
            buildXML += "\t\t<skilllist>\n";
            $.each(v.items, function(j, w) {
                if (w.compset == "Skill") {
                    thisIteration = pad(totalSkills, 5);
                    totalSkills += 1;
                    buildXML += "\t\t\t<id-" + thisIteration + ">\n";
 
                    buildXML += "\t\t\t\t<label type=\"string\">" + w.name + "</label>\n";
                    if (w.hasOwnProperty("skRanks")) {
                        buildXML += "\t\t\t\t<ranks type=\"number\">" + w.skRanks + "</ranks>\n";
                    } else {
                        buildXML += "\t\t\t\t<ranks type=\"number\">0</ranks>\n";
                    }
                    if (w.hasOwnProperty("stNet")) {
                        buildXML += "\t\t\t\t<total type=\"number\">" + w.stNet + "</total>\n";
                    } else {
                        buildXML += "\t\t\t\t<total type=\"number\">0</total>\n";
                    }
                    if (w.hasOwnProperty("stMiscMod")) {
                        buildXML += "\t\t\t\t<miscmod type=\"number\">" + w.stMiscMod + "</miscmod>\n";
                    }
                    buildXML += "\t\t\t\t<ranksfree type=\"number\">0</ranksfree>\n";
                    // Let's do Soldier first, he has only 8 class skills
                    //console.log(smallCharClass);
                    if (smallCharClass == "soldier") {
                        //console.log(w.name);
                        //console.log(jQuery.inArray(w.name, soldArray));
                        if (jQuery.inArray(w.name, soldierArray) >= 0) {
                            buildXML += "\t\t\t\t<state type=\"number\">1</state>\n";
                        } else {
                            buildXML += "\t\t\t\t<state type=\"number\">0</state>\n";
                        }
                    } else if (smallCharClass == "envoy") {
                        if (jQuery.inArray(w.name, envoyArray) >= 0) {
                            buildXML += "\t\t\t\t<state type=\"number\">1</state>\n";
                        } else {
                            buildXML += "\t\t\t\t<state type=\"number\">0</state>\n";
                        }
                    } else if (smallCharClass == "mechanic") {
                        if (jQuery.inArray(w.name, mechanicArray) >= 0) {
                            buildXML += "\t\t\t\t<state type=\"number\">1</state>\n";
                        } else {
                            buildXML += "\t\t\t\t<state type=\"number\">0</state>\n";
                        }
                    } else if (smallCharClass == "mystic") {
                        if (jQuery.inArray(w.name, mysticArray) >= 0) {
                            buildXML += "\t\t\t\t<state type=\"number\">1</state>\n";
                        } else {
                            buildXML += "\t\t\t\t<state type=\"number\">0</state>\n";
                        }
                    } else if (smallCharClass == "operative") {
                        if (jQuery.inArray(w.name, operativeArray) >= 0) {
                            buildXML += "\t\t\t\t<state type=\"number\">1</state>\n";
                        } else {
                            buildXML += "\t\t\t\t<state type=\"number\">0</state>\n";
                        }
                    } else if (smallCharClass == "solarian") {
                        if (jQuery.inArray(w.name, solarianArray) >= 0) {
                            buildXML += "\t\t\t\t<state type=\"number\">1</state>\n";
                        } else {
                            buildXML += "\t\t\t\t<state type=\"number\">0</state>\n";
                        }
                    } else if (smallCharClass == "technomancer") {
                        if (jQuery.inArray(w.name, technomancerArray) >= 0) {
                            buildXML += "\t\t\t\t<state type=\"number\">1</state>\n";
                        } else {
                            buildXML += "\t\t\t\t<state type=\"number\">0</state>\n";
                        }
                    }
                    if (jQuery.inArray(w.name, skillDex) >= 0) {
                        buildXML += "\t\t\t\t<statname type=\"string\">dexterity</statname>\n";
                    } else if (jQuery.inArray(w.name, skillCha) >= 0) {
                        buildXML += "\t\t\t\t<statname type=\"string\">charisma</statname>\n";
                    } else if (jQuery.inArray(w.name, skillInt) >= 0) {
                        buildXML += "\t\t\t\t<statname type=\"string\">intelligence</statname>\n";
                    } else if (jQuery.inArray(w.name, skillStr) >= 0) {
                        buildXML += "\t\t\t\t<statname type=\"string\">strength</statname>\n";
                    } else if (jQuery.inArray(w.name, skillWis) >= 0) {
                        buildXML += "\t\t\t\t<statname type=\"string\">wisdom</statname>\n";
                    }
                 
                    buildXML += "\t\t\t\t<showonminisheet type=\"number\"></showonminisheet>\n";
                    buildXML += "\t\t\t</id-" + thisIteration + ">\n";
                }
            });
            buildXML += "\t\t</skilllist>\n";
 
            // Racial Traits
            var abilityCount = 1;
            buildXML += "\t\t<traitlist>\n";
            $.each(v.items, function(j, w) {
                if (w.compset == "Ability" && !w.hasOwnProperty("AbilType")) {
                    // Need to determine if this is a class ability or racial trait
                    thisIteration = pad(abilityCount, 5);
                    abilityCount += 1
                    buildXML += "\t\t\t<id-" + thisIteration + ">\n";
                    buildXML += "\t\t\t\t<name type=\"string\">" + w.name.split("(")[0] + "</name>\n";
                    buildXML += "\t\t\t</id-" + thisIteration + ">\n";
                }
            });
            buildXML += "\t\t</traitlist>\n";
         
            // Theme abilities
            var themeCount = 1;
            buildXML += "\t\t<themeabilitylist>\n";
            $.each(v.items, function(j, w) {
                if (w.compset == "Ability" && w.hasOwnProperty("AbScUsed")) {
                    thisIteration = pad(themeCount, 5);
                    themeCount += 1;
                    buildXML += "\t\t\t<id-" + thisIteration + ">\n";
                    buildXML += "\t\t\t\t<name type=\"string\">" + w.name.split("(")[0] + "</name>\n";
                    buildXML += "\t\t\t</id-" + thisIteration + ">\n";
                }
            });
            buildXML += "\t\t</themeabilitylist>\n";
         
            // Class Abilities
            var classAbilCount = 1;
            buildXML += "\t\t<specialabilitylist>\n";
            $.each(v.items, function(j, w) {
                if (w.compset == "Ability" && !w.hasOwnProperty("AbScUsed") && w.hasOwnProperty("AbilType") && w.AbilType == "Extra") {
                    thisIteration = pad(classAbilCount, 5);
                    classAbilCount += 1;
                    buildXML += "\t\t\t<id-" + thisIteration + ">\n";
                    buildXML += "\t\t\t\t<name type=\"string\">" + w.name.split("(")[0] + "</name>\n";
                    buildXML += "\t\t\t</id-" + thisIteration + ">\n";
                }
            });
            buildXML += "\t\t</specialabilitylist>\n";
         
            // Notes/personal
            $.each(v.items, function(j, w) {
                if (w.compset == "Personal") {
                    buildXML += "\t\t<gender type=\"string\">" + w.perGenderText + "</gender>\n";
                    buildXML += "\t\t<height type=\"string\">" + w.perHeight + "</height>\n";
                    buildXML += "\t\t<weight type=\"string\">" + w.perWeight + "</weight>\n";
                    buildXML += "\t\t<age type=\"string\">" + w.perAge + "</age>\n";
                } else if (w.compset == "Deity") {
                    buildXML += "\t\t<deity type=\"string\">" + w.name + "</deity>\n";
                } else if (w.compset == "Homeworld") {
                    buildXML += "\t\t<homeworld type=\"string\">" + w.name + "</homeworld>\n";
                } else if (w.compset == "Derived" && w.name == "Initiative") {
                    buildXML += "\t\t<initiative>\n";
                    buildXML += "\t\t\t<misc type=\"number\">" + w.stMiscMod + "</misc>\n";
                    buildXML += "\t\t\t<total type=\"number\">" + w.stNet + "</total>\n";
                    buildXML += "\t\t</initiative>\n";
                }
            });

            // Languages
            var langCount = 1;
            buildXML += "\t\t<languagelist>\n";
            $.each(v.items, function(j, w) {
                if (w.compset == "Language") {
                    thisIteration = pad(langCount, 5);
                    langCount += 1;
                    buildXML += "\t\t\t<id-" + thisIteration + ">\n";
                    buildXML += "\t\t\t\t<name type=\"string\">" + w.name + "</name>\n";
                    buildXML += "\t\t\t</id-" + thisIteration + ">\n";
                }
            });
            buildXML += "\t\t</languagelist>\n";
         
            // Armor Class
            buildXML += "\t\t<ac>\n";
            buildXML += "\t\t\t<sources>\n";
            buildXML += "\t\t\t</sources>\n";
            buildXML += "\t\t\t<totals>\n";
            $.each(v.items, function(j, w) {
                if (w.compset == "ArmorClass") {
                    if (w.name == "Kinetic Armor Class") {
                       buildXML += "\t\t\t\t<kac type=\"number\">" + w.stNet + "</kac>\n";
                    } else if (w.name == "Energy Armor Class") {
                        buildXML += "\t\t\t\t<eac type=\"number\">" + w.stNet + "</eac>\n";
                    } else if (w.name == "AC vs. Combat Maneuvers") {
                        buildXML += "\t\t\t\t<cmd type=\"number\">" + w.stNet + "</cmd>\n";
                    }
                }
            });
            buildXML += "\t\t\t</totals>\n";
            buildXML += "\t\t</ac>\n";
         
            // Saves
            buildXML += "\t\t<saves>\n";
            $.each(v.items, function(j, w) {
                if (w.compset == "Save") {
                    if (w.name == "Fortitude Save") {
                        buildXML += "\t\t\t<fortitude>\n";
                        //buildXML += "\t\t\t\t<base type=\"number\">" + 
                        buildXML += "\t\t\t</fortitude>\n";
                    } else if (w.name == "Reflex Save") {
                        buildXML += "\t\t\t<reflex>\n";
                        buildXML += "\t\t\t\t<base type=\"number\">" + w.stBaseBon + "</base>\n";
                        buildXML += "\t\t\t\t<total type=\"number\">" + w.stNet + "</total>\n";
                        buildXML += "\t\t\t</reflex>\n";
                    } else if (w.name == "Will Save") {
                        buildXML += "\t\t\t<will>\n";
                        buildXML += "\t\t\t\t<base type=\"number\">" + w.stBaseBon + "</base>\n";
                        buildXML += "\t\t\t\t<total type=\"number\">" + w.stNet + "</total>\n";
                        buildXML += "\t\t\t</will>\n";
                    }
                }
            });
            buildXML += "\t\t</saves>\n";
         
            // Size
            if (charRaceType != "ysoki") {
                buildXML += "\t\t<size type=\"string\">Medium</size>\n";
            } else {
                buildXML += "\t\t<size type=\"string\">Small</size>\n";
            }
         
         
            // Speed
            buildXML += "\t\t<speed>\n";
            buildXML += "\t\t\t<armor type=\"number\">0</armor>\n";
            buildXML += "\t\t\t<base type=\"number\">" + charSpeed + "</base>\n";
            buildXML += "\t\t\t<final type=\"number\">" + charSpeed + "</final>\n";
            buildXML += "\t\t\t<misc type=\"number\">0</misc>\n";
            buildXML += "\t\t\t<temporary type=\"number\">0</temporary>\n";
            buildXML += "\t\t\t\t<total type=\"number\">" + charSpeed + "</total>\n";
            buildXML += "\t\t</speed>\n";
         
            // Hitpoits
            buildXML += "\t\t<hp>\n";
            buildXML += "\t\t\t<current type=\"number\">" + charCurrHP + "</current>\n";
            buildXML += "\t\t\t<temporary type=\"number\">0</temporary>\n";
            buildXML += "\t\t\t<total type=\"number\">" + charTotalHP + "</total>\n";
            buildXML += "\t\t\t<wounds type=\"number\">0</wounds>\n";
            buildXML += "\t\t</hp>\n";

            buildXML += "\t\t<rp>\n";
            buildXML += "\t\t\t<current type=\"number\">" + charCurrRP + "</current>\n";
            buildXML += "\t\t\t<mod type=\"number\">0</mod>\n";
            buildXML += "\t\t\t<temporary type=\"number\">0</temporary>\n";
            buildXML += "\t\t\t<total type=\"number\">" + charTotalRP + "</total>\n";
            buildXML += "\t\t</rp>\n";
        });
        allXML = buildXML + endXML
        $('#convChar').val(allXML)
    })
}


function pad(num, size) {
    var s = num + "";
 
    while (s.length < size) s = "0" + s;
    return s;
 }

async function unsubscribeAll() {
    //construct the request to unsubscribe from everything
    const route = "/v1/access/unsubscribe-all";
    const request = {
        accessToken: accessToken,
        gameServer: gameServer,
        callerId: 123
    }
    const response = await submitRequest(route, request)

    //there is nothing to do with the response - it's merely an acknowledgement
    assert(typeof response === 'object', 'unsubscribeAll response')
}

async function submitRequest(url, request) {
    //serialize the data to json for submission
    const json = JSON.stringify(request)

    //submit the request
   url = API_HOST + url
   const response = await fetch(url, { 
      method: 'POST', 
      headers: {
         'Content-Type': 'application/json'
      },
      body: json
   })

    //deserialize the response body into the proper object
    const responseBody = await response.json()

    //sanity check the results and return them
    assert(responseBody.severity === Severity.Success, "submitRequest response severity")
    assert(responseBody.result === Result.Success, "submitRequest response result")
    assert(responseBody.callerId === request.callerId, "submitRequest response callerId")

    return responseBody
}

/** Setup the connection to the signalr hub */
function setup() {
   //construct the connection to the signalr hub
   connection = new signalR.HubConnectionBuilder()
      .withUrl(`${PROTOCOL}${signalrHost}${SIGNALR_ROUTE}`, {
         //configure the access token into the authorization header
         accessTokenFactory: () => accessToken
      })
      //configure a modicum of logging for diagnostics
      .configureLogging(signalR.LogLevel.Debug)
      .build()
   
   //setup a handler for when the connection is closed
   connection.onclose(connectionClosed)
}

/** Whenever the connection is closed, reconnect a few seconds later */
function connectionClosed(error) {
   console.error(error)
   retryConnection()
}

function retryConnection(tryCount = 1) {
   //wait a random interval of a few seconds
   const seconds = Math.floor(Math.random()*3) + 1
   setTimeout(async () => {
      try {
         await connection.start()
      }
      catch (error) {
         console.error(error && error.message ? error.message : "Unknown error")

         if (tryCount >= 5) {
            console.error("Maximum connection retries reached. Access token may have expired or been invalidated. Reload your browser page to acquire a new one.")
         }
         else {
            tryCount++
            retryConnection(tryCount)
         }
      }
   }, seconds*1000)
}

/** Connect to the signalr hub */
async function connect() {
   //setup the callback notification methods that we recognize
   connection.on(CALLBACK, callback)
   connection.on(NOTIFY, notify)

   //connect to the hub
   try {
      await connection.start()
      //console.log("Connected")
   }
   catch (error) {
      console.error(error && error.message ? error.message : "Unknown error")
   }
}

/** Field the basic basic callback from the signalr hub */
function callback(messages) {
   const received = `******** Received from server: ${messages[0]}`
   //console.log(received)
}

/** Invoke a simple method through signalr */
async function ping() {
   try {
      await connection.invoke("ping")
      //console.log("Ping")
   }
   catch (error) {
      console.error(error && error.message ? error.message : "Unknown error")
   }
}

/** Invoke a method through signalr that echoes the string we send back to us */
async function parrot() {
   try {
      const x = await connection.invoke("parrot", 666)
      //console.log(`Parrot: ${x}`)
   }
   catch (error) {
      console.error(error && error.message ? error.message : "Unknown error")
   }
}

/** Invoke a signalr method that echoes back and require authentication */
async function authenticateParrot() {
   try {
      const x = await connection.invoke("authParrot", 666)
      //console.log(`authParrot: ${x}`)
   }
   catch (error) {
      console.error(error && error.message ? error.message : "Unknown error")
   }
}

/** Invoke a signalr method that sends a message back to us via the specified callback */
async function inform() {
   try {
      const x = await connection.invoke("inform", CALLBACK, "the message")
      //console.log(`Inform: ${x}`)
   }
   catch (error) {
      console.error(error && error.message ? error.message : "Unknown error")
   }
}

/** 
 * Field standard notifications from the signalr hub
 * NOTE! We should always receive two parameters - a type and a json object.
 */
function notify(notify, payload) {
   //validate the notification type
   assert(ApiNotify[notify] !== undefined, "Notification type not defined")

   //emit a separator and the type to introduce the notification
   //console.log("--------------------")
   //console.log(`Notification - Type: ${ApiNotify[notify]}`)

   //display the object json for consultation
   //console.log("    %o", payload)
}

function assert(condition, message) {
   if (condition) return
   console.error(`Assertion failed: ${message}`)
}

const Severity = {
   Success: 1,
   Info: 50,
   Warning: 100,
   Error: 150
}

const Result = {
   Success: 0
}

const ApiNotify = {
   UserTokenRevoked: -999,
   [-999]: "UserTokenRevoked",
   ElementTokenRevoked: -86,
   [-86]: "ElementTokenRevoked",
   RetrievalError: -1,
   [-1]: "RetrievalError",
   ShutdownInitiated: 1,
   [1]:  "ShutdownInitiated",
   CharacterLoad: 10,
   [10]: "CharacterLoad",
   CharacterUpdate: 11,
   [11]: "CharacterUpdate",
   StageAppear: 101,
   [101]: "StageAppear",
   StageDisappear: 102,
   [102]: "StageDisappear",
   StageContention: 120,
   [120]: "StageContention"
}
