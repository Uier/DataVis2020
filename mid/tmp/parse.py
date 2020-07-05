import json

wm = open('countries-10m.json', 'r')
world_map = json.load(wm)
wm.close()

cc = open('cc.txt', 'r')
country_continent = dict((lambda c: (c[3], c[0]))(l.split()) for l in cc)
cc.close()

countries = world_map['objects']['countries']['geometries']

for country in countries:
    country['properties']['cont'] = country_continent[country['id']] if 'id' in country else 'N/A'

wmc = open('countries-10m-cont.json', 'a')
json.dump(world_map, wmc)
wmc.close()
