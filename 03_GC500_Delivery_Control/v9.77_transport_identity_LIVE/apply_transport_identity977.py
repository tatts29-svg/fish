# Author: Andrew Fisher. Bounded source identity correction for transport forecast.
def apply_transport_identity977(s,rep):
 return rep(s,"const nums = [...new Set((a.asset_numbers || []).map(String))], co=contractOf(a.key)","const nums = typeof TransportIdentity977!=='undefined'?transportBuildingNumbers977(a):[...new Set((a.asset_numbers || []).map(String))], co=contractOf(a.key)")
