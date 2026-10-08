"""Author: Andrew Fisher. Marked island holding edge, not a road lane or capacity survey.
The four marked originals were read. Gov aerial is older than Andrew's parking-area image;
matching crossing/island/Higman features locate the strip. Numbers show order, not vehicle dimensions.
Pixel authoring coordinates refer to unrotated aerial.jpg and its supplied EPSG3857 registration.
"""
import json,math,os
A=json.load(open(os.path.join(os.path.dirname(__file__),'aerial.json')))
def ll(x,y):
 x1,y1,x2,y2=A['bbox3857'];X=x1+x/A['W']*(x2-x1);Y=y2-y/A['H']*(y2-y1)
 return (math.degrees(2*math.atan(math.exp(Y/6378137))-math.pi/2),math.degrees(X/6378137))
# After the red crossing, inside the landward island edge, ending before Higman.
HOLDING=[ll(x,y) for x,y in [(612,922),(631,984),(658,1076),(687,1178)]]
# Advance south to the crossing, turn LEFT; do not continue down Main Beach Parade.
TURN=[ll(x,y) for x,y in [(559,827),(562,871),(580,900),(615,914),(630,936)]]
