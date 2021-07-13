# online-sourcemap-lookup
A tool for consuming source maps directly from production environments.

Built because we regularly get bug reports in the form of line numbers and column numbers in our compiled and minified 
JavaScript production code. Having source maps on production (preferably hidden from customers) or local allows us to map these 
stack trace errors to original source code.    

# Usage

Install with `npm install -g online-sourcemap-lookup`, then run `online-sourcemap-lookup -h` for detailed usage.

```
Lookup of production uglified,minified,compressed,... javascript stack trace line and column number and display actual source code location.

Usage: 
	online-sourcemap-lookup <https://domain/path/to/js/file.js>:<line number>:<column number> [options]

valid [options]:
	-h, --help		 Show this help message.
	-v, --version		 Show current version.
	-A			 The number of lines to print after the target line. Default is 5.
	-B			 The number of lines to print before the target line. Default is 5.
	-C			 The number of lines to print before and after the target line. If supplied, -A and -B are ignored.
	-s <sourcepath> 	 Provide a path to the actual source files, this will be used to find the file to use when printing the lines from the source file. Default is ./
	-m <source-map-url> 	 Provide a URL to the actual source maps file, this will be used to lookup source maps. Default is the same as .js URL location. Example: http://domain/path/to/js/source/maps/
```

# Example output

Ran the following command: `online-sourcemap-lookup https://anyhost.com/my-site/static/main.1ae303a6f8b6caf24b4e.js:1:683258 -s /project/source/code/path/ -m http://anyhost.com/my-site/static/source-maps` to get this output:

```

Downloading sourcemap file from https://anyhost.com/my-site/static/source-maps/main.1ae303a6f8b6caf24b4e.js.map
Original Position: 
	webpack:///src/webapp/app/my-site/components/map.component.ts, Line 55:10

Code Section: 
50 |     const products$ = zip(
51 |       this.productsService.products,
52 |       this.mapLoaded$
53 |     );
54 | 
55>|     throw Error('Im horrible ErRoR!!');
               ^
56 | 
57 |     const userPosition$ = this.mapLoaded$
58 |       .pipe(
59 |         switchMap(() => this.userPositionService.getUserPosition())
60 |       );


```
