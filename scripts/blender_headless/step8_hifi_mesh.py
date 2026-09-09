"""
Step 8: higher-fidelity runtime mesh.

Two findings drove this:

1. The runtime mesh is only 84,802 verts in Blender but exported as 494,500,
   because the baked AO lived on a CORNER-domain colour attribute and glTF has
   to split every face corner. Moving the bake to POINT domain removes that
   5.8x vertex inflation outright.
2. That freed budget buys real triangles. The R3 source is 3.12M tris; at 172k
   the decimation resolved ~1.1mm features, which smoothed away the dry fibrous
   micro-relief. Raising the target restores it as REAL geometry rather than
   faking it with a normal map -- which matters here because this mesh is too
   topologically fragmented for a UV atlas to carry per-texel detail.

Macro pores stay real geometry throughout; nothing is faked.

Pipeline: weld the frozen HP (EDGE_SPLIT left duplicate verts) -> decimate to
target -> auto-smooth -> bake AO selected-to-active HP->LP into a POINT-domain
colour -> apply the approved AO gamma + ochre tint -> export Draco GLB.
"""
import bpy
import bmesh
import sys

WORK = r"D:\Projects\sayfer-bio\assets\blender\sayfer-scaffold-v2-bake-work.blend"

TRI_TARGET = int(sys.argv[sys.argv.index("--") + 1])
OUT_GLB = sys.argv[sys.argv.index("--") + 2]
SAVE_BLEND = sys.argv[sys.argv.index("--") + 3] if len(sys.argv) > sys.argv.index("--") + 3 else ""

AO_GAMMA = 1.45                  # approved cavity/exterior separation
TINT = (0.791, 0.5642, 0.16625)  # approved warm ochre (base * step6 tint)
AO_DISTANCE = 0.006

bpy.ops.wm.open_mainfile(filepath=WORK)
scene = bpy.context.scene
hp = bpy.data.objects["Scaffold_HP_bake"]

# ---- 1. build the new low-poly from a welded copy of the HP ----
me = bpy.data.meshes.new_from_object(hp)
bm = bmesh.new()
bm.from_mesh(me)
bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-6)
bm.to_mesh(me)
bm.free()
me.name = "Scaffold_LP_hifi_mesh"

lp = bpy.data.objects.new("Scaffold_LP_hifi", me)
scene.collection.objects.link(lp)
lp.matrix_world = hp.matrix_world.copy()

tris_before = sum(len(p.vertices) - 2 for p in me.polygons)
ratio = min(1.0, TRI_TARGET / float(tris_before))
print(f"welded HP tris={tris_before} -> decimate ratio {ratio:.4f} for target {TRI_TARGET}")

dec = lp.modifiers.new("decimate", "DECIMATE")
dec.decimate_type = "COLLAPSE"
dec.ratio = ratio
dec.use_collapse_triangulate = True

bpy.ops.object.select_all(action="DESELECT")
lp.select_set(True)
bpy.context.view_layer.objects.active = lp
bpy.ops.object.modifier_apply(modifier="decimate")

# crisp torn edges stay crisp, broad walls stay smooth
bpy.ops.object.shade_auto_smooth(angle=1.0472)  # 60 deg

tris_after = sum(len(p.vertices) - 2 for p in lp.data.polygons)
print(f"runtime mesh: tris={tris_after} verts={len(lp.data.vertices)}")

# ---- 2. bake AO from HP into a POINT-domain colour attribute ----
scene.render.engine = "CYCLES"
scene.cycles.device = "CPU"
scene.cycles.samples = 64
scene.world.light_settings.distance = AO_DISTANCE
scene.world.light_settings.ao_factor = 1.0
scene.render.bake.target = "VERTEX_COLORS"
scene.render.bake.use_selected_to_active = True
scene.render.bake.max_ray_distance = 0.0025
scene.render.bake.cage_extrusion = 0.0015
scene.render.bake.use_cage = False

stub = bpy.data.materials.new("Scaffold_LP_hifi_stub")
lp.data.materials.clear()
lp.data.materials.append(stub)

ao_attr = lp.data.color_attributes.new(name="final_vc", type="FLOAT_COLOR", domain="POINT")
lp.data.attributes.active_color = ao_attr

bpy.ops.object.select_all(action="DESELECT")
hp.select_set(True)
lp.select_set(True)
bpy.context.view_layer.objects.active = lp
print("baking AO (selected-to-active, HP -> hi-fi LP, POINT domain)...")
bpy.ops.object.bake(type="AO")
print("AO bake done")

# ---- 3. approved AO gamma + ochre tint, straight into the colour attribute ----
tr, tg, tb = TINT
lo = hi = 0
n = len(ao_attr.data)
for i in range(n):
    ao = min(1.0, ao_attr.data[i].color[0]) ** AO_GAMMA
    ao_attr.data[i].color = (tr * ao, tg * ao, tb * ao, 1.0)
    if ao < 0.25:
        lo += 1
    elif ao > 0.7:
        hi += 1
print(f"AO after gamma {AO_GAMMA}: deep={lo/n:.1%} lit={hi/n:.1%}")

lp.data.color_attributes.render_color_index = lp.data.color_attributes.find("final_vc")

# ---- 4. export ----
bpy.ops.object.select_all(action="DESELECT")
lp.select_set(True)
bpy.context.view_layer.objects.active = lp
bpy.ops.export_scene.gltf(
    filepath=OUT_GLB,
    export_format="GLB",
    use_selection=True,
    export_apply=True,
    export_yup=True,
    export_normals=True,
    export_texcoords=False,
    export_tangents=False,
    export_materials="PLACEHOLDER",
    export_vertex_color="ACTIVE",
    export_active_vertex_color_when_no_material=True,
    export_draco_mesh_compression_enable=True,
    export_draco_mesh_compression_level=6,
    export_draco_position_quantization=14,
    export_draco_normal_quantization=10,
    export_draco_color_quantization=10,
)
print("EXPORTED", OUT_GLB)

if SAVE_BLEND:
    bpy.ops.wm.save_as_mainfile(filepath=SAVE_BLEND)
    print("SAVED", SAVE_BLEND)
print("DONE_STEP8")
