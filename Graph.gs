class Module {
  constructor(name, rowNo, colNo, resourceList = [], representative = null, prereqs = new Set(), category = "") {
    this.name = name; // string
    this.rowNo = rowNo; // int
    this.colNo = colNo; // int
    this.resourceList = resourceList; // list of resources
    this.representative = representative; // a resource
    this.prereqs = prereqs; // set of modules
    this.category = category; // string
  }
}

class Resource {
  constructor(name, link, moduleClassification = null, prereqModules = new Set(), category = "", tags = []) {
    this.name = name; // string
    this.link = link; // URL
    this.moduleClassification = moduleClassification; // instance of Module
    this.prereqModules = prereqModules; // set of modules -> this is strings at generation because we don't know that all modules have been generated yet, might want to modify this later
    this.category = category; // string
    this.tags = tags; // list of strings
  }
}

let graph_resource_list = [];

const moduleMap = new Map();

function generateGraphResourceList() {
  // Open the Google Sheet by its name or ID
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Resources');
  const data = sheet.getDataRange().getValues();

  // Clear the global resource list
  graph_resource_list = [];

  // Process the header and data rows
  const headers = data[0]; // Assuming first row is the header
  const rows = data.slice(1); // Skip header row

  rows.forEach((row, index) => {
    const resourceName = row[headers.indexOf('Resource Name')];
    const link = row[headers.indexOf('Link')];
    const category = row[headers.indexOf('Category')];
    const moduleNames = row[headers.indexOf('Module')].split(',').map(tag => tag.trim());
    const tags = row[headers.indexOf('Tags')].split(',').map(tag => tag.trim());
    const prereqModules = row[headers.indexOf('Prerequisite module(s)')].split(',').map(prereq => prereq.trim());
    const level = row[headers.indexOf('Level')]; // Optional if needed

    // Ensure the module exists in the map
    moduleNames.forEach((moduleName) => {
      let moduleInstance = moduleMap.get(moduleName);
      if (!moduleInstance) {
        moduleInstance = new Module(moduleName, null, null, [], null, new Set(), category);
        moduleMap.set(moduleName, moduleInstance);
      }

      // Create the resource
      const resource = new Resource(
        resourceName,
        link,
        moduleInstance,
        new Set(prereqModules),
        category,
        tags
      );

      // Add the resource to the module's resource list
      moduleInstance.resourceList.push(resource);

      // Add the resource to the global list
      graph_resource_list.push(resource);
    });
  });

  // Log the global resource list (for debugging)
  console.log(graph_resource_list);

  return graph_resource_list;
}

function myFunction() {
  
}

