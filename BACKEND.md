// AUTH
POST /login → Login check G and add to db | returns token

// MAIN
GET /networks → All networks | returns id, name
GET /networks/:id/coresites → Core sites in that network | returns [id, name]
GET /networks/:id/coredevices → Core devices in that network | returns [id, name, ip]

?? GET /networks/:id/site-links → Sites connected to that coredevice (dynamically generated OSPF and CDP with db cache) | returns [id, name, physicalStatus, protocolStatus, mplsLDP, OSPF, BW, description, mediaType, CDP, TX, RX, MTU] and lazy loading

GET /favorite-links/:user-id → Favorite links of the user | returns links

// ADMIN
POST
ADD-DELETE

Alerts

get-site-description
get-site-topology
