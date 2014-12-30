---
layout: post
title: "Double Encoded UTF-8 Data in MySQL"
description: ""
category: encoding
tags: [encoding utf8 latin1 ascii unicode mysql]
---
<p class="date">2013 May 05</p>

I recently had the misfortune of dealing with a MySQL database which got its data double UTF-8 encoded. It happened during a software deploy so my colleagues and I had to come up with a quick solution and get our database back into live service. Luckily, we were able to find a stopgap solution, and later, during the next maintenance window, we were able to fix the data for good.

In the process, I learned more about MySQL and character encodings schemes, so I thought I'd share it here in a blog post.


###What Happened###

During the software deploy, we migrated a MySQL database to a new server. While QA testing we realized that we had an encoding issue with the data on the new server. I wasn't involved with the database migration so I can't speak to how it happened, but I was able to piece together what happened.

Our data is UTF-8 encoded and all our MySQL database tables are configured for UTF-8. When importing the data into the new database, the import process interpreted the data as latin1 and translated it to UTF-8 since it was storing the data in UTF-8 tables. Because the data was already UTF-8 encoded, it essentially got encoded twice as UTF-8.


###Double Encoded Data###

Let me explain more what I mean by double encoded UTF-8 data as well as some basic definitions.

__[Code Point:](http://en.wikipedia.org/wiki/Code_point)__ is a reference to the numerical value of a single character in an encoding scheme.

__[ASCII:](http://en.wikipedia.org/wiki/ASCII)__ is a 7 bit character encoding based on the English alphabet. There are only 128 characters (or code points).

__Latin1:__ is a reference to MySQL latin1 which is [Windows-1252 or CP-1252](http://en.wikipedia.org/wiki/Windows-1252). This is an 8 bit character encoding which is a superset of ASCII expanded to include characters for other Western European languages. There are 256 characters and it's is backwards compatible with ASCII.

__[UTF-8:](http://en.wikipedia.org/wiki/UTF-8)__ is a variable width character encoding which can represent every character in the Unicode character set. Each code points is represented in 1-6 bytes. It is backwards compatible with ASCII.

In our case, UTF-8 data was interpreted as latin1 data and translated to UTF-8 again. Since latin1 characters are fixed at one byte, each byte is translated individually without any consideration of subsequent bytes. (Note that if we were translating from UTF-8 to latin1, we would have to consider the context of subsequent bytes for multi-byte code points)

Looking that both encoding specifications for UTF-8 and latin1 (CP-1252), as well as running a few translation tests in MySQL, I learned the following:

+ The ASCII subset (0x00 - 0x7F) of latin1 translates to the same encoding in UTF-8 (single byte code points).
+ The non-ASCII subset (0x80 - 0xFF) of latin1 translates to multi-byte UTF-8 code points.
+ All 255 latin1 code points map to unique UTF-8 code points, and translate back to the same latin1 code points

The first point is interesting, because if you deal with mostly English locales it's possible to have an encoding mismatch in your application but not discover it for a good amount of time. In fact, if all you dealt with is ASCII data, you would never expose the problem.

The last point indicates that the double UTF-8 encoding is a lossless translation. We should be able to run the data through a UTF-8 -> latin1 translation to recover the original data. Because of this, we were able to implement a stopgap solution without having to revert databases.


###Stopgap Solution###

The stopgap solution was rather simple. We changed our application to set the MySQL ODBC connection from UTF-8 to latin1. This caused MySQL to perform a UTF-8 -> latin1 translation so the double encoded UTF-8 data became single encoded. The application continued to treat the data as UTF-8 so things worked mostly well with that fix.

Could we have left it like this? Not really. The database size was now bloated and there was obvious CPU overhead with having to encode/decode data with every database transaction. If these were the only side effects, it might have been tolerable to leave this setup as-is since fixing the data was not easy due to the volume of it. However, one big problem this presented was that text limited fields might get truncated since the double encoding bloat wasn't accounted for when the application wrote to the database. For example, an application which tried to store a 10 character Chinese string into a varchar(10) field would find the value truncated when it read it back. Since we didn't have likely cases for this to happen, it was acceptable as a stopgap, but unacceptable for anything longer. Therefore we needed to fix the data at the next maintenance window. 


###Fixing the Data###

Fixing the data also turned out to be a simple solution. We performed a data migration to second MySQL database server with the export process configured to export to latin1. This caused MySQL to translate the double encoded UTF-8 data to single encoded UTF-8. The data was imported into the second server as UTF-8 data (correctly this time).


