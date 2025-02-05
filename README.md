# google-map-routing-package

`google-map-routing-package` is a TypeScript-based service that simplifies the routing and transportation logistics for students and drivers using Google Maps. It dynamically generates routes based on student locations and vehicle capacity, ensuring the most efficient route assignments for drivers.

## Installation

This is a [Angular](https://angular.dev/) module available through the
[npm registry](https://www.npmjs.com/).

Installation is done using the
[`npm install` command](https://docs.npmjs.com/getting-started/installing-npm-packages-locally):

```console
$ npm install google-map-routing-package
```

## Features

  * Initialize and display Google Maps with school and student locations.
  * Automatically generate and display optimal routes for multiple drivers.
  * Efficiently handle vehicle capacity and distribute students based on proximity.
  * Supports real-time route updates with color-coded routes for each driver.
  * Calculate and log the total distance and duration for each driver’s route.

## Docs & Community



## Quick Start

To integrate the google-map-routing-package into your Angular application, follow the steps below.

1. Install the Package
First, install the package from npm:

```console
$ npm install google-map-routing-package
```

2. Import and Initialize in Angular Component
In your Angular component, import the GoogleMapRoutingPackage and use it to set up the map and routing logic.
  
```ts
import { AfterViewInit, ChangeDetectorRef, Component } from '@angular/core';
import { GoogleMapRoutingPackage } from 'google-map-routing-package';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-test1',
  templateUrl: './test1.component.html',
  styleUrls: ['./test1.component.scss']
})
export class Test1Component implements AfterViewInit {
  gservice = new GoogleMapRoutingPackage();
  drivers: any[] = [];
  schoolId = 2;

  constructor(private cdr: ChangeDetectorRef) { }

  ngAfterViewInit() {
    const mapElement = document.getElementById("map") as HTMLElement;
    const busCapacity = 5;
    const mapZoom = 11;

    // Find school data from environment or use default
    const schoolData = environment.students.find((student: any) => student.SchoolID === this.schoolId);
    const schoolLocation = schoolData ? 
      { location: { lat: schoolData.SchoolLatitude, lng: schoolData.SchoolLongitude }, id: schoolData.SchoolID, name: schoolData.SchoolName } :
      { location: { lat: 51.24435222090445, lng: -0.19657615577176069 }, id: this.schoolId, name: "KP's School" };

    // Filter and map student data
    const students = environment.students
      .filter(s => s.SchoolID === this.schoolId)
      .map((s, index) => ({ location: { lat: s.Latitude, lng: s.Longitude }, name: s.FirstName, id: index + 1 }));

    // Set values for the service
    this.gservice.setValues(schoolLocation, students, [], busCapacity, mapZoom);

    // Initialize the map
    this.gservice.initMap(mapElement, schoolLocation.location);

    // Generate routes for the drivers
    this.gservice.createRoutesForDrivers();
    this.drivers = this.gservice.drivers;

    // Trigger change detection to reflect updated data
    this.cdr.detectChanges();
  }

  getRouteForDriver(driverIndex: number) {
    this.gservice.getRouteForDriver(driverIndex);
  }
}

```
3. HTML Template
In your component's HTML, create a button for each driver that will show their route when clicked.

```html
<div>
  <button style="margin: 7px;" *ngFor="let driver of drivers; let i = index" (click)="getRouteForDriver(i)">
    Driver {{ i + 1 }}
  </button>
</div>

<!-- Map display -->
<div id="map" style="height: 1000px; width: 100%;"></div>
```

4. Fetching School and Student Data via API
Instead of storing school and student data in the environment.ts file, you can call an API to retrieve this information dynamically.

5. Google Maps API
Make sure you have set up the Google Maps API correctly in your index.html or in the environment configuration (like an API key) to ensure that the map functions as expected.
Example for index.html:
```html
 <script src="https://maps.googleapis.com/maps/api/js?key=YOUR_GOOGLE_MAPS_API_KEY&libraries=places"></script>
```

6. Run Your Application
Finally, run your Angular app using:

```ts
$ ng serve
```

Visit http://localhost:4200 to see the map with the routes generated for your drivers.

