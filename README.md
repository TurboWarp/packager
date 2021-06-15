<!--
# Scaffolding

A (relatively) small Scratch project player. Built on top of TurboWarp/Scratch, but without React. Batteries not included.

Intended for eventually being used in the TurboWarp packager.

 - Simple -- You don't have to worry about how to hook together all the Scratch packages. It does all that for you.
 - Lightweight -- Several MB smaller than scratch-gui
 - Fast -- Starts hundreds of milliseconds faster than scratch-gui. No React or Redux to slow everything down.

See index.html for a fully-featured example.

To keep things small, simple, and fast, some things are impossible:

 - You have to fetch the project on your own
 - Configuration is most likely required
 - Can not load a different project into an existing Scaffolding instance. Make a new one instead
-->
